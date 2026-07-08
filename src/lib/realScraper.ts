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
  { designation: "Founder", department: "Leadership", tests: ["founder", "co-founder", "co founder"] },
  { designation: "CTO", department: "IT", tests: ["cto", "chief technology officer"] },
  { designation: "IT Head", department: "IT", tests: ["it head", "head it", "head of it", "it manager", "information technology"] },
  { designation: "Admin", department: "Administration", tests: ["admin head", "administrator", "administration"] },
  { designation: "Director", department: "Leadership", tests: ["director", "managing director"] },
  { designation: "COO", department: "Operations", tests: ["coo", "chief operating officer"] },
  { designation: "HR Head", department: "HR", tests: ["hr head", "head hr", "head of hr", "human resources", "chief human resources"] },
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
  const direct = queryType === "website" || queryType === "linkedin" ? normalizeUrl(query) : normalizeUrl(query);
  if (direct && !direct.includes("linkedin.com")) return [direct];
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
