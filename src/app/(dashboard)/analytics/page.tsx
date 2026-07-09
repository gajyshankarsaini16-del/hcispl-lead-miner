import { getIndustryBreakdown, getScoreDistribution, getCompanyStats } from "@/lib/repo";

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-sm text-text truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-line-soft overflow-hidden">
        <div className="h-full rounded-full bg-brass" style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }} />
      </div>
      <div className="w-8 text-right font-data text-xs text-text-muted">{count}</div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const industries = await getIndustryBreakdown();
  const dist = await getScoreDistribution();
  const stats = await getCompanyStats();
  const maxIndustry = Math.max(1, ...industries.map((i) => i.count));
  const maxDist = Math.max(1, dist.high, dist.mid, dist.low);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Analytics</h1>
      <p className="mt-1 text-sm text-text-muted">
        Live view over {stats.total} companies mined so far.
      </p>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-sm font-semibold text-text mb-4">Industry mix</h2>
          {industries.length === 0 ? (
            <p className="text-sm text-text-muted">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {industries.map((i) => (
                <Bar key={i.industry} label={i.industry} count={i.count} max={maxIndustry} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-sm font-semibold text-text mb-4">Lead score distribution</h2>
          <div className="space-y-3">
            <Bar label="High (≥70)" count={dist.high} max={maxDist} />
            <Bar label="Mid (40–69)" count={dist.mid} max={maxDist} />
            <Bar label="Low (<40)" count={dist.low} max={maxDist} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-line-soft bg-line-soft/40 px-4 py-3 text-xs text-text-muted leading-relaxed max-w-2xl">
        This covers the metrics real data supports today. Trend-over-time charts and
        per-rep breakdowns make more sense once Phase 9 (bulk processing) and the queue
        system are feeding data continuously — worth revisiting then.
      </div>
    </div>
  );
}
