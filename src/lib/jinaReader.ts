export async function fetchCleanContent(url: string): Promise<string | null> {
  const key = process.env.JINA_API_KEY;
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}