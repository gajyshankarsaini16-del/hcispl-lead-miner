type AiSummaryResult = { summary: string; leadRationale: string };

async function callGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function callGroq(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function generateAiSummary(companyName: string, scrapedText: string): Promise<AiSummaryResult> {
  const prompt = `You are a B2B sales research assistant. Based on this raw text scraped from "${companyName}"'s website, write:
1) A 2-3 sentence company summary (what they do, industry, scale if mentioned)
2) A 1-sentence lead-quality rationale for a B2B IT/services vendor targeting this company

Raw text (truncated): """${scrapedText.slice(0, 4000)}"""

Respond ONLY in this exact format:
SUMMARY: <text>
RATIONALE: <text>`;

  const output = (await callGemini(prompt)) ?? (await callGroq(prompt));

  if (!output) {
    return { summary: "AI summary unavailable — no AI provider key configured or both providers failed.", leadRationale: "" };
  }

  const summaryMatch = output.match(/SUMMARY:\s*([\s\S]*?)(?:\nRATIONALE:|$)/i);
  const rationaleMatch = output.match(/RATIONALE:\s*([\s\S]*)/i);

  return {
    summary: summaryMatch?.[1]?.trim() || output.trim(),
    leadRationale: rationaleMatch?.[1]?.trim() || "",
  };
}

export type AiContact = { name: string; designation: string; department: string };

export async function extractDecisionMakersAI(companyName: string, scrapedText: string): Promise<AiContact[]> {
  const prompt = `From the following text scraped from "${companyName}"'s official website (About, Team, Leadership, Contact pages), extract REAL, individually named decision makers only — CEO, Founder, CTO, Director, COO, IT Head, HR Head, Admin Head.

Rules:
- Only include a person if their FULL NAME and JOB TITLE are BOTH explicitly and clearly stated in the text, next to each other.
- Never guess, invent, or merge unrelated words into a name or title.
- Never include department/team/support names as if they were a person.
- If the same person holds two titles (e.g. Founder & CEO), list them ONCE with a combined designation like "Founder & CEO" — never twice.
- If you are not fully confident, exclude that person entirely.
- Maximum 6 people.

Text: """${scrapedText.slice(0, 6000)}"""

Respond ONLY with a raw JSON array, no markdown, no explanation, in this exact shape:
[{"name": "Full Name", "designation": "Exact Job Title", "department": "Leadership|IT|HR|Administration|Operations"}]
If no one qualifies, respond with exactly: []`;

  const output = (await callGemini(prompt)) ?? (await callGroq(prompt));
  if (!output) return [];

  try {
    const cleaned = output.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p?.name && p?.designation)
      .slice(0, 6)
      .map((p) => ({
        name: String(p.name).trim(),
        designation: String(p.designation).trim(),
        department: String(p.department ?? "Leadership").trim(),
      }));
  } catch {
    return [];
  }
}