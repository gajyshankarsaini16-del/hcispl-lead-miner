export type EnrichmentResult = {
  website: string | null;
  industry: string | null;
  employees: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  founded: string | null;
  gst: string | null;
  address: string | null;
  summary: string;
  leadScore: number;
  priorityScore: number;
  confidenceScore: number;
  latitude?: number | null;
  longitude?: number | null;
  contacts: Array<{
    name: string;
    designation: string;
    department: string;
    businessEmail: string | null;
    businessPhone: string | null;
    linkedin: string | null;
    confidenceScore: number;
    source: string;
  }>;
  social: { linkedin: string | null; facebook: string | null; instagram: string | null; x: string | null; youtube: string | null };
  technologies: { firewall: string | null; cloud: string | null; email: string | null; erp: string | null; crm: string | null; hosting: string | null; analytics: string | null; cdn: string | null; cms: string | null };
};

type FetchedPage = {
  url: string;
  html: string;
  text: string;
  headers: Headers;
};

const ROLE_KEYWORDS = [
  { designation: "CEO", department: "Leadership", tests: ["ceo", "chief executive officer", "chief executive"] },
  { designation: "Founder", department: "Leadership", tests: ["founder", "co-founder", "co founder", "founder & ceo", "founder and ceo"] },
  { designation: "CTO", department: "IT", tests: ["cto", "chief technology officer", "chief technical officer"] },
  { designation: "IT Head", department: "IT", tests: ["it head", "head it", "head of it", "it manager", "information technology", "vp of engineering", "head of engineering"] },
  { designation: "Admin", department: "Administration", tests: ["admin head", "administrator", "administration"] },
  { designation: "Director", department: "Leadership", tests: ["director", "managing director"] },
  { designation: "COO", department: "Operations", tests: ["coo", "chief operating officer"] },
  { designation: "HR Head", department: "HR", tests: ["hr head", "head hr", "head of hr", "human resources", "chief human resources", "chief people officer", "vp of people", "head of talent"] },
];

const INDUSTRY_KEYWORDS: Array<[string, string[]]> = [
  ["Manufacturing", ["manufacturing", "factory", "plant", "industrial", "machining", "fabrication"]],
  ["IT Services", ["software", "cloud", "saas", "technology", "digital transformation", "cybersecurity"]],
  ["Logistics", ["logistics", "transport", "freight", "supply chain", "warehouse"]],
  ["Healthcare", ["hospital", "healthcare", "clinic", "medical", "diagnostic"]],
  ["Pharma", ["pharma", "pharmaceutical", "formulation", "api manufacturing"]],
  ["Financial Services", ["finance", "nbfc", "insurance", "banking", "investment"]],
  ["Education", ["school", "college", "university", "edtech", "training"]],
  ["Retail", ["retail", "ecommerce", "store", "consumer goods"]],
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function slugCompanyName(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function candidateWebsites(query: string, queryType: string): string[] {
  if (queryType === "linkedin") {
    const slugMatch = query.match(/linkedin\.com\/company\/([^/?#]+)/i);
    if (!slugMatch) return [];
    const slug = slugMatch[1].replace(/[^a-z0-9]/gi, "");
    if (slug.length < 3) return [];
    return [`https://www.${slug}.com`, `https://www.${slug}.in`, `https://www.${slug}.co.in`, `https://${slug}.com`];
  }

  const direct = normalizeUrl(query);
  if (direct) return [direct];
  if (queryType !== "name") return [];

  const slug = slugCompanyName(query);
  if (!slug || slug.length < 3) return [];
  return [`https://www.${slug}.com`, `https://www.${slug}.in`, `https://www.${slug}.co.in`, `https://${slug}.com`];
}

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "LeadMiner/1.0 (+local research tool)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function stripHtml(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchPage(url: string): Promise<FetchedPage | null> {
  const res = await fetchWithTimeout(url);
  if (!res?.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return null;
  const html = await res.text();
  return { url: res.url, html, text: stripHtml(html), headers: res.headers };
}

function absoluteUrl(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function discoverImportantLinks(home: FetchedPage) {
  const links = Array.from(home.html.matchAll(/href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map((m) => ({ href: decodeEntities(m[1]), label: stripHtml(m[2]).toLowerCase() }))
    .filter((l) => /about|contact|team|leadership|management|director|career/i.test(`${l.href} ${l.label}`))
    .map((l) => absoluteUrl(home.url, l.href))
    .filter((l): l is string => Boolean(l));

  return Array.from(new Set([home.url, ...links])).slice(0, 7);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function extractEmails(text: string) {
  return unique(Array.from(text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).map((m) => m[0].toLowerCase()))
    .filter((email) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email))
    .slice(0, 5);
}

function extractPhones(text: string) {
  return unique(
    Array.from(text.matchAll(/(?:\+91[\s-]?)?(?:0[\s-]?)?[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}|\+91[\s-]?\d{2,5}[\s-]?\d{6,8}/g)).map((m) =>
      m[0].replace(/\s+/g, " ").trim()
    )
  ).slice(0, 5);
}

function extractGst(text: string) {
  return text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/i)?.[0]?.toUpperCase() ?? null;
}

function extractFounded(text: string) {
  return text.match(/\b(?:founded|established|since|incorporated)\D{0,20}((?:19|20)\d{2})\b/i)?.[1] ?? null;
}

function extractSocial(html: string) {
  const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map((m) => decodeEntities(m[1]));
  const find = (host: string) => hrefs.find((h) => h.toLowerCase().includes(host)) ?? null;
  return {
    linkedin: find("linkedin.com"),
    facebook: find("facebook.com"),
    instagram: find("instagram.com"),
    x: find("x.com") ?? find("twitter.com"),
    youtube: find("youtube.com"),
  };
}

function inferIndustry(text: string) {
  const lower = text.toLowerCase();
  return INDUSTRY_KEYWORDS.find(([, words]) => words.some((w) => lower.includes(w)))?.[0] ?? null;
}

function inferLocation(text: string) {
  const state = INDIAN_STATES.find((s) => text.toLowerCase().includes(s.toLowerCase())) ?? null;
  const cityMatch = text.match(/\b(Mumbai|Pune|Bengaluru|Bangalore|Chennai|Hyderabad|Delhi|Gurugram|Gurgaon|Noida|Ahmedabad|Kolkata|Jaipur|Surat|Vadodara)\b/i);
  return { city: cityMatch?.[0] ?? null, state, country: text.toLowerCase().includes("india") ? "India" : null };
}

function extractAddress(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+|\s{2,}/).map((s) => s.trim());
  const match = sentences.find((s) => {
    const lower = s.toLowerCase();
    return s.length > 25 && s.length < 260 && /(address|registered office|corporate office|head office|plot|sector|road|street|industrial area|pincode|pin code)/i.test(lower);
  });
  return match ?? null;
}

function extractTechnologies(pages: FetchedPage[]) {
  const html = pages.map((p) => p.html).join("\n").toLowerCase();
  const headers = pages.map((p) => `${p.headers.get("server") ?? ""} ${p.headers.get("cf-ray") ? "cloudflare" : ""}`).join(" ").toLowerCase();
  return {
    firewall: headers.includes("cloudflare") || html.includes("cloudflare") ? "Cloudflare" : null,
    cloud: headers.includes("amazon") || html.includes("amazonaws") ? "AWS" : headers.includes("azure") ? "Azure" : null,
    email: html.includes("google.com/a/") || html.includes("google-site-verification") ? "Google Workspace" : html.includes("outlook") || html.includes("office365") ? "Microsoft 365" : null,
    erp: html.includes("sap") ? "SAP" : html.includes("tally") ? "Tally" : null,
    crm: html.includes("hubspot") ? "HubSpot" : html.includes("zoho") ? "Zoho" : html.includes("salesforce") ? "Salesforce" : null,
    hosting: headers || null,
    analytics: html.includes("google-analytics") || html.includes("gtag(") ? "Google Analytics" : null,
    cdn: headers.includes("cloudflare") ? "Cloudflare" : null,
    cms: html.includes("wp-content") ? "WordPress" : html.includes("webflow") ? "Webflow" : null,
  };
}

function candidateName(value: string) {
  const cleaned = value.replace(/[,|:;()]/g, " ").replace(/\s+/g, " ").trim();
  const match = cleaned.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/);
  if (!match) return null;
  const name = match[1];
  if (/Limited|Private|Company|Director|Founder|Officer|Head|Manager|Technology|Resources/.test(name)) return null;
  return name;
}

type JsonLdOrg = {
  sameAs?: string[];
  founder?: Array<{ name?: string } | string> | { name?: string } | string;
  employee?: Array<{ name?: string; jobTitle?: string }>;
  foundingDate?: string;
  address?: { streetAddress?: string; addressLocality?: string; addressRegion?: string; addressCountry?: string } | string;
};

function extractJsonLd(html: string): JsonLdOrg | null {
  const blocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const org = items.find((item) => {
        const type = item?.["@type"];
        return type === "Organization" || type === "Corporation" || (Array.isArray(type) && type.includes("Organization"));
      });
      if (org) return org as JsonLdOrg;
    } catch {
      // Not valid/parseable JSON-LD — skip.
    }
  }
  return null;
}

function jsonLdFounderNames(org: JsonLdOrg): string[] {
  const raw = org.founder;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((f) => (typeof f === "string" ? f : f?.name)).filter((n): n is string => Boolean(n));
}

function extractRoleContacts(text: string, email: string | null, phone: string | null, linkedin: string | null) {
  const chunks = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|\s[-|]\s/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8 && s.length < 220);

  return ROLE_KEYWORDS.map((role) => {
    const line = chunks.find((chunk) => role.tests.some((test) => chunk.toLowerCase().includes(test)));
    const name = line ? candidateName(line) : null;
    if (!name) return null;
    return {
      name,
      designation: role.designation,
      department: role.department,
      businessEmail: email,
      businessPhone: phone,
      linkedin,
      confidenceScore: 55,
      source: "Company website",
    };
  }).filter((c): c is NonNullable<typeof c> => Boolean(c));
}

function score(result: Pick<EnrichmentResult, "website" | "gst" | "address" | "industry" | "contacts" | "social">, emails: string[], phones: string[]) {
  let points = 0;
  if (result.website) points += 15;
  if (emails.length) points += 15;
  if (phones.length) points += 15;
  if (result.address) points += 10;
  if (result.gst) points += 15;
  if (result.industry) points += 10;
  if (result.social.linkedin || result.social.facebook || result.social.instagram) points += 10;
  if (result.contacts.length) points += 10;
  return Math.min(points, 100);
}

export async function runRealEnrichment(query: string, queryType = "name"): Promise<EnrichmentResult> {
  const candidates = candidateWebsites(query, queryType);
  let home: FetchedPage | null = null;

  for (const url of candidates) {
    home = await fetchPage(url);
    if (home) break;
  }

  // NEW: if direct guessing failed, try search providers (SerpApi -> Tavily -> DuckDuckGo)
  if (!home && queryType === "name") {
    const { findCompanyWebsite } = await import("@/lib/webSearchProviders");
    const found = await findCompanyWebsite(query);
    if (found) home = await fetchPage(found);
  }

  if (!home) {
    const messages: Record<string, string> = {
      gst: "GST-number lookup needs a paid company-registry API (e.g. MCA/GSTIN data providers) — that's not connected yet, so this couldn't be resolved to a company. Try searching by company name or website instead.",
      cin: "CIN lookup needs a paid MCA (Ministry of Corporate Affairs) data API — that's not connected yet. Try searching by company name or website instead.",
      linkedin: "LinkedIn blocks automated scraping of its pages, so a LinkedIn URL alone can't be read directly. Try the company's official website instead, or its name.",
      website: "Couldn't reach that website — double check the URL is correct and public.",
      name: "Couldn't find a public website for that company name. Try entering the website URL directly for a more reliable result.",
    };
    return {
      website: normalizeUrl(query),
      industry: null,
      employees: null,
      city: null,
      state: null,
      country: null,
      founded: null,
      gst: null,
      address: null,
      summary: messages[queryType] ?? messages.name,
      leadScore: 0,
      priorityScore: 0,
      confidenceScore: 0,
      latitude: null,
      longitude: null,
      contacts: [],
      social: { linkedin: null, facebook: null, instagram: null, x: null, youtube: null },
      technologies: { firewall: null, cloud: null, email: null, erp: null, crm: null, hosting: null, analytics: null, cdn: null, cms: null },
    };
  }

  // NEW: if the scraped homepage has very little text (JS-heavy SPA), retry via Jina Reader
  if (home.text.length < 200) {
    const { fetchCleanContent } = await import("@/lib/jinaReader");
    const cleanText = await fetchCleanContent(home.url);
    if (cleanText && cleanText.length > home.text.length) {
      home = { ...home, text: cleanText };
    }
  }

  const pages = [home];
  for (const url of discoverImportantLinks(home).slice(1)) {
    const page = await fetchPage(url);
    if (page) pages.push(page);
  }

  const html = pages.map((p) => p.html).join("\n");
  const text = pages.map((p) => p.text).join(" ");
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const social = extractSocial(html);
  const jsonLd = extractJsonLd(home.html);

  if (jsonLd?.sameAs) {
    for (const url of jsonLd.sameAs) {
      const lower = url.toLowerCase();
      if (!social.linkedin && lower.includes("linkedin.com")) social.linkedin = url;
      if (!social.facebook && lower.includes("facebook.com")) social.facebook = url;
      if (!social.instagram && lower.includes("instagram.com")) social.instagram = url;
      if (!social.x && (lower.includes("x.com") || lower.includes("twitter.com"))) social.x = url;
      if (!social.youtube && lower.includes("youtube.com")) social.youtube = url;
    }
  }

  const location = inferLocation(text);
  const contacts = extractRoleContacts(text, emails[0] ?? null, phones[0] ?? null, social.linkedin);

  for (const founderName of jsonLdFounderNames(jsonLd ?? {})) {
    if (contacts.some((c) => c.name.toLowerCase() === founderName.toLowerCase())) continue;
    contacts.push({
      name: founderName,
      designation: "Founder",
      department: "Leadership",
      businessEmail: emails[0] ?? null,
      businessPhone: phones[0] ?? null,
      linkedin: social.linkedin,
      confidenceScore: 65,
      source: "Company website (structured data)",
    });
  }

  if ((emails[0] || phones[0]) && contacts.length === 0) {
    contacts.push({
      name: "Company Contact",
      designation: "General Contact",
      department: "Admin",
      businessEmail: emails[0] ?? null,
      businessPhone: phones[0] ?? null,
      linkedin: social.linkedin,
      confidenceScore: 75,
      source: "Company website",
    });
  }

  const base = {
    website: home.url,
    industry: inferIndustry(text),
    employees: null,
    city: location.city,
    state: location.state,
    country: location.country,
    founded: extractFounded(text) ?? jsonLd?.foundingDate?.slice(0, 4) ?? null,
    gst: extractGst(text),
    address:
      extractAddress(text) ??
      (typeof jsonLd?.address === "string"
        ? jsonLd.address
        : jsonLd?.address
        ? [jsonLd.address.streetAddress, jsonLd.address.addressLocality, jsonLd.address.addressRegion, jsonLd.address.addressCountry]
            .filter(Boolean)
            .join(", ") || null
        : null),
    summary: "Profile built from publicly available pages on the company's own website. Fields not published by the company are left blank.",
    leadScore: 0,
    priorityScore: 0,
    confidenceScore: 0,
    contacts,
    social,
    technologies: extractTechnologies(pages),
  };

  // NEW: AI-generated summary (Gemini -> Groq fallback)
  const { generateAiSummary } = await import("@/lib/aiEnrichment");
  const ai = await generateAiSummary(query, text);
  if (ai.summary && !ai.summary.startsWith("AI summary unavailable")) {
    base.summary = ai.summary;
  }

  // NEW: geocode the scraped address via PositionStack
  let geo: { latitude: number; longitude: number; city: string | null; region: string | null; country: string | null } | null = null;
  if (base.address) {
    const { geocodeAddress } = await import("@/lib/geocoding");
    geo = await geocodeAddress(base.address);
  }

  // NEW: fill missing email/phone on scraped contacts using FullEnrich
  if (base.contacts.length > 0) {
    const { enrichContactsFromFullEnrich } = await import("@/lib/fullEnrichProvider");
    const domain = base.website ? new URL(base.website).hostname.replace(/^www\./, "") : null;
    const enriched = await enrichContactsFromFullEnrich({
      companyName: query,
      domain,
      contacts: base.contacts.map((c) => ({ name: c.name, linkedin: c.linkedin })),
    });
    for (const e of enriched) {
      const existing = base.contacts.find((c) => c.name.toLowerCase() === e.name.toLowerCase());
      if (existing) {
        existing.businessEmail = existing.businessEmail ?? e.businessEmail;
        existing.businessPhone = existing.businessPhone ?? e.businessPhone;
        if (e.businessEmail || e.businessPhone) existing.confidenceScore = Math.max(existing.confidenceScore, e.confidenceScore);
      }
    }
  }

  const completeness = score(base, emails, phones);
  return {
    ...base,
    leadScore: completeness,
    priorityScore: Math.min(100, completeness + (contacts.length ? 10 : 0)),
    confidenceScore: completeness,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  };
}

export function buildVerifyUrl(queryType: string, query: string, companyName?: string | null): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (queryType === "gst") {
    return "https://services.gst.gov.in/services/searchtp";
  }
  if (queryType === "cin") {
    return "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do";
  }
  if (queryType === "linkedin") {
    if (/linkedin\.com/i.test(trimmed)) return trimmed;
    const term = companyName || trimmed;
    return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(term)}`;
  }
  return null;
}