import type { EnrichmentResult } from "@/lib/realScraper";

export type ProviderKeys = {
  apollo?: string | null;
  hunter?: string | null;
};

type ProviderContact = EnrichmentResult["contacts"][number];

const TARGET_TITLES = [
  "Founder",
  "Co-Founder",
  "CEO",
  "CTO",
  "IT Head",
  "Head of IT",
  "Admin Head",
  "Director",
  "Managing Director",
  "COO",
  "HR Head",
  "Head of HR",
  "Human Resources",
];

function domainFrom(value: string | null | undefined) {
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

function titleToDepartment(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("cto") || lower.includes("it") || lower.includes("technology")) return "IT";
  if (lower.includes("hr") || lower.includes("human resources")) return "HR";
  if (lower.includes("admin")) return "Administration";
  if (lower.includes("coo") || lower.includes("operating")) return "Operations";
  return "Leadership";
}

function cleanPhone(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "sanitized_number" in value) {
    return String((value as { sanitized_number?: unknown }).sanitized_number ?? "");
  }
  return null;
}

function normalizeApolloPerson(person: Record<string, unknown>): ProviderContact | null {
  const name = String(person.name ?? "").trim();
  if (!name) return null;
  const title = String(person.title ?? person.headline ?? "").trim() || "Decision Maker";
  const phoneList = Array.isArray(person.phone_numbers) ? person.phone_numbers : [];
  const phone = cleanPhone(person.sanitized_phone) ?? cleanPhone(phoneList[0]);
  const email = typeof person.email === "string" && !person.email.includes("email_not_unlocked") ? person.email : null;

  return {
    name,
    designation: title,
    department: titleToDepartment(title),
    businessEmail: email,
    businessPhone: phone || null,
    linkedin: typeof person.linkedin_url === "string" ? person.linkedin_url : null,
    confidenceScore: 80,
    source: "Apollo API",
  };
}

async function fetchApolloContacts(apiKey: string, companyName: string, domain: string | null) {
  const body: Record<string, unknown> = {
    page: 1,
    per_page: 25,
    person_titles: TARGET_TITLES,
  };
  if (domain) body.q_organization_domains = domain;
  else body.q_organization_name = companyName;

  const res = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const data = (await res.json().catch(() => null)) as { people?: Array<Record<string, unknown>>; contacts?: Array<Record<string, unknown>> } | null;
  const people = data?.people ?? data?.contacts ?? [];
  return people.map(normalizeApolloPerson).filter((c): c is ProviderContact => Boolean(c));
}

function normalizeHunterEmail(email: Record<string, unknown>): ProviderContact | null {
  const value = typeof email.value === "string" ? email.value : null;
  if (!value) return null;
  const firstName = typeof email.first_name === "string" ? email.first_name : "";
  const lastName = typeof email.last_name === "string" ? email.last_name : "";
  const name = `${firstName} ${lastName}`.trim() || "Company Contact";
  const title = typeof email.position === "string" && email.position ? email.position : "Company Contact";
  return {
    name,
    designation: title,
    department: titleToDepartment(title),
    businessEmail: value,
    businessPhone: null,
    linkedin: typeof email.linkedin === "string" ? email.linkedin : null,
    confidenceScore: typeof email.confidence === "number" ? email.confidence : 70,
    source: "Hunter API",
  };
}

async function fetchHunterContacts(apiKey: string, domain: string | null) {
  if (!domain) return [];
  const url = new URL("https://api.hunter.io/v2/domain-search");
  url.searchParams.set("domain", domain);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", "25");
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json().catch(() => null)) as { data?: { emails?: Array<Record<string, unknown>> } } | null;
  return (data?.data?.emails ?? []).map(normalizeHunterEmail).filter((c): c is ProviderContact => Boolean(c));
}

function dedupeContacts(contacts: ProviderContact[]) {
  const seen = new Set<string>();
  return contacts.filter((contact) => {
    const key = `${contact.name}|${contact.businessEmail ?? ""}|${contact.linkedin ?? ""}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function enrichContactsFromProviders(input: {
  companyName: string;
  website?: string | null;
  query?: string;
  keys: ProviderKeys;
}) {
  const domain = domainFrom(input.website) ?? domainFrom(input.query);
  const contacts: ProviderContact[] = [];

  if (input.keys.apollo) {
    contacts.push(...(await fetchApolloContacts(input.keys.apollo, input.companyName, domain)));
  }
  if (input.keys.hunter) {
    contacts.push(...(await fetchHunterContacts(input.keys.hunter, domain)));
  }

  return dedupeContacts(contacts);
}
