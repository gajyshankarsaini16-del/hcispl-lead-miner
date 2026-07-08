import { listCompanies } from "@/lib/repo";
import { ScoreBar } from "@/components/ScoreBar";
import { Download } from "lucide-react";

export default async function ExportsPage() {
  const companies = listCompanies({ limit: 500 });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">Exports</h1>
          <p className="mt-1 text-sm text-text-muted max-w-xl">
            Export everything mined so far as a spreadsheet — matches the column layout
            from the SRS (contacts by role, technologies, lead score, remarks).
          </p>
        </div>
        <a
          href="/api/exports/csv"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-text-inverse hover:bg-ink-soft transition-colors"
        >
          <Download size={15} /> Export CSV
        </a>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-card overflow-hidden">
        {companies.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">
            No companies yet — run a search or bulk upload first.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-text-muted">
                <th className="px-5 py-2.5 font-medium">Company</th>
                <th className="px-5 py-2.5 font-medium">Industry</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Lead score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {companies.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 text-text">{c.name}</td>
                  <td className="px-5 py-3 text-text-muted">{c.industry ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize ${
                        c.status === "complete"
                          ? "bg-malachite/10 text-malachite"
                          : c.status === "failed"
                          ? "bg-rust/10 text-rust"
                          : "bg-line-soft text-text-muted"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <ScoreBar score={c.lead_score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
