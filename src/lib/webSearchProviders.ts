// Priority: SerpApi -> Tavily -> DuckDuckGo (unofficial, last resort)

export async function findCompanyWebsite(companyName: string): Promise<string | null> {
  const serpApi = await serpApiSearch(`${companyName} official website`);
  if (serpApi) return serpApi;

  const tavily = await tavilySearch(`${companyName} official website`);
  if (tavily) return tavily;

  const ddg = await duckDuckGoSearch(`${companyName} official website`);
  if (ddg) return ddg;

  return null;
}

async function serpApiSearch(query: string): Promise<string | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google&api_key=${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.organic_results?.[0]?.link ?? null;
  } catch {
    return null;
  }
}

async function tavilySearch(query: string): Promise<string | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query, max_results: 3 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

async function duckDuckGoSearch(query: string): Promise<string | null> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/class="result__a"[^>]*href="([^"]+)"/);
    if (!match) return null;
    const rawHref = match[1].replace(/&amp;/g, "&");
    try {
      const url = new URL(rawHref, "https://duckduckgo.com");
      const real = url.searchParams.get("uddg");
      return real ? decodeURIComponent(real) : rawHref;
    } catch {
      return rawHref;
    }
  } catch {
    return null;
  }
}

export type SocialSearchResult = {
  google: string | null;
  linkedin: string | null;
  x: string | null;
  instagram: string | null;
  facebook: string | null;
};

async function searchOnePlatform(query: string): Promise<string | null> {
  const { firecrawlSearch } = await import("@/lib/firecrawl");
  const fc = await firecrawlSearch(query, 3);
  if (fc.length > 0) return fc[0].url;
  return findCompanyWebsite(query);
}

export async function findAllSocialProfiles(companyName: string): Promise<SocialSearchResult> {
  const [google, linkedin, x, instagram, facebook] = await Promise.all([
    searchOnePlatform(`${companyName} official website`),
    searchOnePlatform(`${companyName} company site:linkedin.com/company`),
    searchOnePlatform(`${companyName} official site:x.com OR site:twitter.com`),
    searchOnePlatform(`${companyName} official site:instagram.com`),
    searchOnePlatform(`${companyName} official site:facebook.com`),
  ]);

  return {
    google,
    linkedin: linkedin?.includes("linkedin.com") ? linkedin : null,
    x: x && (x.includes("x.com") || x.includes("twitter.com")) ? x : null,
    instagram: instagram?.includes("instagram.com") ? instagram : null,
    facebook: facebook?.includes("facebook.com") ? facebook : null,
  };
}