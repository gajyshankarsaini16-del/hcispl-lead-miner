"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";

const QUERY_TYPES = [
  { value: "name", label: "Company name" },
  { value: "website", label: "Website" },
  { value: "gst", label: "GST" },
  { value: "cin", label: "CIN" },
  { value: "linkedin", label: "LinkedIn URL" },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [queryType, setQueryType] = useState("website");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, queryType }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Search failed.");
      return;
    }
    const data = await res.json();
    router.push(`/companies/${data.companyId}`);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Company search</h1>
      <p className="mt-1 text-sm text-text-muted max-w-xl">
        Search by official website URL for the most accurate result. Lead Miner extracts
        public emails, phones, address, GST, social links, industry signals, and published
        leadership names from the company's own site.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl">
        <div className="rounded-lg border border-line bg-card p-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUERY_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setQueryType(t.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  queryType === t.value
                    ? "bg-ink text-text-inverse"
                    : "bg-line-soft text-text-muted hover:text-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              placeholder={
                queryType === "website"
                  ? "e.g. https://www.company.com"
                  : queryType === "name"
                    ? "e.g. Vertex Industrial Ltd (website URL is better)"
                    : `Enter ${QUERY_TYPES.find((t) => t.value === queryType)?.label.toLowerCase()}`
              }
              className="w-full rounded-md border border-line bg-paper pl-9 pr-3 py-2.5 text-sm text-text placeholder:text-text-muted/70 focus:border-brass"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-text-inverse hover:bg-ink-soft transition-colors disabled:opacity-60"
        >
          {loading ? "Mining..." : "Run search"}
        </button>
      </form>

      <div className="mt-8 max-w-xl rounded-lg border border-line-soft bg-line-soft/40 px-4 py-3 text-xs text-text-muted leading-relaxed">
        This build uses real public website extraction. If Apollo or Hunter is connected
        in Integrations, Lead Miner also pulls provider contacts directly into the company
        profile and CSV export.
      </div>
    </div>
  );
}
