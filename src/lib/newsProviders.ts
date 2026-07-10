export type CompanyNewsItem = { title: string; url: string; publishedAt: string; source: string };

export async function fetchCompanyNews(companyName: string): Promise<CompanyNewsItem[]> {
  const gnews = await fetchGNews(companyName);
  if (gnews.length) return gnews;
  return fetchNewsData(companyName);
}

async function fetchGNews(companyName: string): Promise<CompanyNewsItem[]> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(companyName)}&max=5&token=${key}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.articles ?? []).map((a: { title: string; url: string; publishedAt: string; source: { name: string } }) => ({
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name ?? "GNews",
    }));
  } catch {
    return [];
  }
}

async function fetchNewsData(companyName: string): Promise<CompanyNewsItem[]> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://newsdata.io/api/1/news?apikey=${key}&q=${encodeURIComponent(companyName)}&language=en`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? []).slice(0, 5).map((a: { title: string; link: string; pubDate: string; source_id: string }) => ({
      title: a.title,
      url: a.link,
      publishedAt: a.pubDate,
      source: a.source_id,
    }));
  } catch {
    return [];
  }
}