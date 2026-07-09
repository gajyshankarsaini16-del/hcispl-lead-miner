import Link from "next/link";
import { listSearchHistory, getCompanyById } from "@/lib/repo";
import { ScoreBar } from "@/components/ScoreBar";

export default async function HistoryPage() {
  const history = (await listSearchHistory(100)) as Array<{
    id: number;
    query: string;
    query_type: string;
    company_id: number | null;
    company_name: string | null;
    created_at: string;
  }>;

  const rows = await Promise.all(
    history.map(async (r) => ({
      ...r,
      company: r.company_id ? await getCompanyById(r.company_id) : undefined,
    }))
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Search history</h1>
      <p className="mt-1 text-sm text-text-muted">Every search you've run, most recent first.</p>

      <div className="mt-6 rounded-lg border border-line bg-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">Nothing here yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-text-muted">
                <th className="px-5 py-2.5 font-medium">Company</th>
                <th className="px-5 py-2.5 font-medium">Query type</th>
                <th className="px-5 py-2.5 font-medium">Lead score</th>
                <th className="px-5 py-2.5 font-medium">Searched</th>
                <th className="px-5 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 text-text">{r.company_name ?? r.query}</td>
                  <td className="px-5 py-3 text-text-muted capitalize">{r.query_type}</td>
                  <td className="px-5 py-3">
                    {r.company ? <ScoreBar score={r.company.lead_score} /> : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-text-muted font-data">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.company_id && (
                      <Link href={`/companies/${r.company_id}`} className="text-xs font-medium text-brass-strong hover:underline">
                        View
                      </Link>
                    )}
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
