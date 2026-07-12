import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyById, getContactsForCompany, getSocialForCompany, getTechForCompany, getLatestSearchForCompany } from "@/lib/repo";
import { buildVerifyUrl } from "@/lib/realScraper";
import { fetchCompanyNews } from "@/lib/newsProviders";
import { CoreSample } from "@/components/ScoreBar";
import { ArrowLeft, Globe, Mail, Phone, Link2, ExternalLink, Newspaper } from "lucide-react";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className="text-sm text-text mt-0.5">{value || "—"}</div>
    </div>
  );
}

export default async function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = Number(id);
  const company = await getCompanyById(companyId);
  if (!company) notFound();

  const contacts = await getContactsForCompany(companyId);
  const social = await getSocialForCompany(companyId);
  const tech = await getTechForCompany(companyId);
  const latestSearch = await getLatestSearchForCompany(companyId);
  const news = await fetchCompanyNews(company.name);

  const verifyUrl = latestSearch ? buildVerifyUrl(latestSearch.query_type, latestSearch.query, company.name) : null;
  const verifyLabel =
    latestSearch?.query_type === "gst"
      ? "Verify on GST portal"
      : latestSearch?.query_type === "cin"
      ? "Verify on MCA portal"
      : latestSearch?.query_type === "linkedin"
      ? "Open on LinkedIn"
      : null;

  return (
    <div>
      <Link href="/search" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text">
        <ArrowLeft size={13} /> Back to search
      </Link>

      <div className="mt-3 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">{company.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-text-muted flex-wrap">
            {company.industry && <span>{company.industry}</span>}
            {company.city && <span>{company.city}, {company.state}</span>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brass-strong hover:underline">
                <Globe size={13} /> {company.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>

        <CoreSample
          segments={[
            { label: "Lead score", score: company.lead_score },
            { label: "Priority", score: company.priority_score },
            { label: "Confidence", score: company.confidence_score },
          ]}
        />
      </div>

      {company.summary && (
        <p className="mt-5 max-w-2xl text-sm text-text-muted leading-relaxed border-l-2 border-brass/50 pl-4">{company.summary}</p>
      )}

      {verifyUrl && verifyLabel && (
        <a href={verifyUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-medium text-text hover:bg-line-soft">
          <ExternalLink size={13} /> {verifyLabel}
        </a>
      )}

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Employees" value={company.employees} />
        <Field label="Founded" value={company.founded} />
        <Field label="GST" value={company.gst} />
        <Field label="CIN" value={company.cin} />
        <Field label="Address" value={[company.address, company.city, company.state, company.country].filter(Boolean).join(", ")} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-base font-semibold text-text">Decision makers</h2>
        <div className="mt-3 rounded-lg border border-line bg-card overflow-hidden">
          {contacts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">No public contacts found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-text-muted">
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Designation</th>
                  <th className="px-5 py-2.5 font-medium">Email</th>
                  <th className="px-5 py-2.5 font-medium">Phone</th>
                  <th className="px-5 py-2.5 font-medium">Source</th>
                  <th className="px-5 py-2.5 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 text-text">{c.name}</td>
                    <td className="px-5 py-3 text-text-muted">{c.designation}</td>
                    <td className="px-5 py-3 text-xs">
                      {c.business_email ? (
                        <a href={`mailto:${c.business_email}`} className="inline-flex items-center gap-1 text-text hover:text-brass-strong">
                          <Mail size={12} /> {c.business_email}
                        </a>
                      ) : (
                        <span className="text-text-muted">Not found</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {c.business_phone ? (
                        <a href={`tel:${c.business_phone}`} className="inline-flex items-center gap-1 text-text hover:text-brass-strong">
                          <Phone size={12} /> {c.business_phone}
                        </a>
                      ) : (
                        <span className="text-text-muted">Not found</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted">{c.source}</td>
                    <td className="px-5 py-3 font-data text-xs text-text">{c.confidence_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div>
          <h2 className="font-display text-base font-semibold text-text">Technology detected</h2>
          <div className="mt-3 rounded-lg border border-line bg-card p-5 grid grid-cols-2 gap-y-4 gap-x-4">
            <Field label="Cloud" value={tech?.cloud} />
            <Field label="Firewall" value={tech?.firewall} />
            <Field label="Email" value={tech?.email} />
            <Field label="ERP" value={tech?.erp} />
            <Field label="CRM" value={tech?.crm} />
            <Field label="Hosting" value={tech?.hosting} />
            <Field label="CMS" value={tech?.cms} />
            <Field label="CDN" value={tech?.cdn} />
          </div>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-text">Social presence</h2>
          <div className="mt-3 rounded-lg border border-line bg-card p-5 space-y-3">
            {social && (["linkedin", "facebook", "instagram", "x", "youtube"] as const).map((k) =>
              social[k] ? (
                <a key={k} href={social[k]!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-text hover:text-brass-strong">
                  <span className="capitalize">{k}</span>
                  <span className="text-xs text-text-muted truncate max-w-[60%]">{social[k]}</span>
                </a>
              ) : null
            )}
            {(!social || Object.values(social).every((v) => !v)) && (
              <div className="text-sm text-text-muted">No public profiles found.</div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-text flex items-center gap-1.5">
            <Newspaper size={15} /> Current news
          </h2>
          <div className="mt-3 rounded-lg border border-line bg-card p-5 space-y-4">
            {news.length === 0 && (
              <div className="text-sm text-text-muted">Not found — no recent news, or news API key not configured.</div>
            )}
            {news.map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="text-sm text-text group-hover:text-brass-strong leading-snug">{n.title}</div>
                <div className="mt-1 text-[11px] text-text-muted">{n.source} · {new Date(n.publishedAt).toLocaleDateString()}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}