type FirecrawlSearchResult = { url: string; title: string; markdown?: string };

export async function firecrawlSearch(query: string, limit = 3): Promise<FirecrawlSearchResult[]> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []) as FirecrawlSearchResult[];
  } catch {
    return [];
  }
}

export async function firecrawlScrapeMarkdown(url: string): Promise<string | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.markdown ?? null;
  } catch {
    return null;
  }
}

export type FirecrawlPerson = { name: string; title: string };

export async function firecrawlExtractPeople(url: string, companyName: string): Promise<FirecrawlPerson[]> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: [
          {
            type: "json",
            prompt: `Extract every named decision maker (CEO, Founder, CTO, Director, COO, IT Head, HR Head, Admin Head) explicitly mentioned on this page for "${companyName}". Only include people whose full name and job title are both clearly stated. Return an empty list if none qualify.`,
            schema: {
              type: "object",
              properties: {
                people: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      title: { type: "string" },
                    },
                    required: ["name", "title"],
                  },
                },
              },
              required: ["people"],
            },
          },
        ],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const people = data?.data?.json?.people ?? [];
    return Array.isArray(people) ? people.filter((p) => p?.name && p?.title) : [];
  } catch {
    return [];
  }
}