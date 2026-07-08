"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ processed: number; companyIds: number[] } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setLoading(true);
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/bulk-upload", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    const data = await res.json();
    setResult(data);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Bulk upload</h1>
      <p className="mt-1 text-sm text-text-muted max-w-xl">
        Upload a CSV with one company name per row (a header row is fine). Each company
        runs through the same enrichment pipeline as a single search.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl">
        <label
          htmlFor="csv"
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-card px-6 py-10 text-center cursor-pointer hover:border-brass transition-colors"
        >
          <UploadCloud size={22} className="text-text-muted" />
          <div className="text-sm text-text">
            {file ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <FileText size={14} /> {file.name}
              </span>
            ) : (
              "Click to choose a CSV file"
            )}
          </div>
          <div className="text-xs text-text-muted">company_name.csv · up to 200 rows in this demo build</div>
          <input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <div className="mt-3 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-text-inverse hover:bg-ink-soft transition-colors disabled:opacity-60"
        >
          {loading ? "Processing…" : "Upload and process"}
        </button>
      </form>

      {result && (
        <div className="mt-8 max-w-xl rounded-lg border border-malachite/30 bg-malachite/5 px-5 py-4">
          <div className="flex items-center gap-2 text-malachite font-medium text-sm">
            <CheckCircle2 size={16} /> Processed {result.processed} companies
          </div>
          <ul className="mt-3 space-y-1.5">
            {result.companyIds.map((id) => (
              <li key={id}>
                <Link href={`/companies/${id}`} className="text-sm text-brass-strong hover:underline">
                  View profile #{id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
