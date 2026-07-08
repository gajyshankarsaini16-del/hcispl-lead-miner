function tierColor(score: number) {
  if (score >= 70) return "var(--tier-high)";
  if (score >= 40) return "var(--tier-mid)";
  return "var(--tier-low)";
}

export function ScoreBar({ score, label }: { score: number; label?: string }) {
  const color = tierColor(score);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative w-16 h-2 rounded-full bg-line-soft overflow-hidden shrink-0">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.max(4, score)}%`, background: color }}
        />
      </div>
      <span className="font-data text-xs text-text tabular-nums">{score}</span>
      {label && <span className="text-xs text-text-muted">{label}</span>}
    </div>
  );
}

/** Vertical "core sample" — a few stacked scores read like a drilled sample. Used on company profile. */
export function CoreSample({
  segments,
}: {
  segments: Array<{ label: string; score: number }>;
}) {
  return (
    <div className="flex items-end gap-4">
      {segments.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-2">
          <div className="w-6 h-24 rounded-[3px] bg-line-soft relative overflow-hidden flex items-end">
            <div
              className="w-full rounded-[3px]"
              style={{ height: `${Math.max(6, s.score)}%`, background: tierColor(s.score) }}
            />
          </div>
          <div className="font-data text-sm text-text tabular-nums">{s.score}</div>
          <div className="text-[11px] text-text-muted text-center leading-tight w-16">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
