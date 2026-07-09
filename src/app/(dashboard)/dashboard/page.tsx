import Link from "next/link";
import { getCompanyStats, listSearchHistory } from "@/lib/repo";
import { Search, UploadCloud } from "lucide-react";

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-text tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

export default async function DashboardHome() {
  const stats = await getCompanyStats();
  const recent = (await listSearchHistory(6)) as Array<{
    id: number;
    query: string;
    query_type: string;
    company_id: number | null;
    company_name: string | null;
    created_at: string;
  }>;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">Overview</h1>
          <p className="mt-1 text-sm text-text-muted">Everything mined so far, at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-text-inverse hover:bg-ink-soft transition-colors"
          >
            <Search size={15} /> Search a company
          </Link>
          <Link
            href="/bulk-upload"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-card px-3.5 py-2 text-sm font-medium text-text hover:border-brass transition-colors"
          >
            <UploadCloud size={15} /> Bulk upload
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Companies mined" value={stats.total} />
        <StatCard label="Profiles complete" value={stats.complete} />
        <StatCard label="Avg. lead score" value={stats.avgLeadScore} hint="0–100" />
        <StatCard label="High priority" value={stats.highPriority} hint="Priority ≥ 70" />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-text">Recent activity</h2>
          <Link href="/history" className="text-xs text-brass-strong hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-3 rounded-lg border border-line bg-card overflow-hidden">
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-text-muted">
              No searches yet. Run your first search to see it here.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-text truncate">{r.company_name ?? r.query}</div>
                    <div className="text-xs text-text-muted font-data">
                      {r.query_type} · {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  {r.company_id && (
                    <Link
                      href={`/companies/${r.company_id}`}
                      className="text-xs font-medium text-brass-strong hover:underline shrink-0 ml-3"
                    >
                      View profile
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
