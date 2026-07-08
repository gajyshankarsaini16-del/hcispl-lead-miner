/**
 * Placeholder enrichment engine.
 *
 * This stands in for Phases 2–8 of the SRS (Search Engine, Website Intelligence,
 * Decision Maker Intelligence, Social Intelligence, Technology Detection, Company
 * Intelligence, AI Analysis). It produces plausible, clearly-fake structured data
 * so the rest of the product (DB, UI, exports) can be built and tested end to end.
 *
 * Swap this out module-for-module as you build each real phase — e.g. replace
 * `runMockEnrichment` with a call into your actual scraper/AI engine once it exists.
 * Keep the same return shape and nothing upstream has to change.
 */

export type EnrichmentResult = {
  website: string | null;
  industry: string;
  employees: string;
  city: string;
  state: string;
  country: string;
  founded: string;
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
  technologies: { firewall: string; cloud: string; email: string; erp: string; crm: string; hosting: string; analytics: string; cdn: string; cms: string };
};

const INDUSTRIES = ["Manufacturing", "IT Services", "Logistics", "Healthcare", "Financial Services", "Retail", "Pharma"];
const CITIES: Array<[string, string]> = [
  ["Gurugram", "Haryana"],
  ["Mumbai", "Maharashtra"],
  ["Bengaluru", "Karnataka"],
  ["Pune", "Maharashtra"],
  ["Chennai", "Tamil Nadu"],
];
const TITLES = ["Founder", "Managing Director", "CTO", "IT Head", "Procurement Head", "HR Head", "Finance Head"];

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function runMockEnrichment(companyName: string): EnrichmentResult {
  const rand = seededRandom(companyName.toLowerCase());
  const [city, state] = pick(rand, CITIES);
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const leadScore = Math.round(40 + rand() * 60);
  const priorityScore = Math.round(30 + rand() * 70);
  const confidenceScore = Math.round(50 + rand() * 50);

  const contactCount = 2 + Math.floor(rand() * 3);
  const usedTitles = new Set<string>();
  const contacts = Array.from({ length: contactCount }).map(() => {
    let title = pick(rand, TITLES);
    while (usedTitles.has(title) && usedTitles.size < TITLES.length) title = pick(rand, TITLES);
    usedTitles.add(title);
    const hasEmail = rand() > 0.35;
    return {
      name: pick(rand, ["A. Sharma", "R. Verma", "S. Iyer", "N. Gupta", "P. Nair", "K. Reddy"]),
      designation: title,
      department: title.includes("IT") || title.includes("CTO") ? "IT" : title.includes("Finance") ? "Finance" : title.includes("HR") ? "HR" : "Leadership",
      businessEmail: hasEmail ? `contact@${slug}.com` : null,
      businessPhone: rand() > 0.6 ? `+91 98${Math.floor(rand() * 9e7 + 1e7)}` : null,
      linkedin: rand() > 0.3 ? `https://linkedin.com/in/${slug}-${title.toLowerCase().replace(/\s+/g, "-")}` : null,
      confidenceScore: Math.round(40 + rand() * 60),
