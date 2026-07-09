import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { get, all, run } from "@/lib/db";
import {
  createCompany,
  updateCompany,
  addContact,
  upsertSocial,
  upsertTech,
} from "@/lib/repo";
import { runRealEnrichment } from "@/lib/realScraper";
import { enrichContactsFromProviders } from "@/lib/contactProviders";
import { getProviderKey } from "@/lib/providerKeys";

function parseCsvNames(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  // Drop a header row if the first cell looks like a label rather than a company name.
  const first = lines[0].split(",")[0].trim().toLowerCase();
  const startIdx = ["company", "company name", "name"].includes(first) ? 1 : 0;
  return lines.slice(startIdx).map((l) => l.split(",")[0].trim()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Upload a CSV file with one company name per row." }, { status: 400 });
  }

  const text = await file.text();
  const names = parseCsvNames(text).slice(0, 200); // cap for a synchronous demo run
  if (names.length === 0) {
    return NextResponse.json({ error: "No company names found in that file." }, { status: 400 });
  }

  const jobRow = await get<{ id: number }>(
    `INSERT INTO bulk_jobs (user_id, filename, total_rows, processed_rows, status)
     VALUES ($1, $2, $3, 0, 'processing') RETURNING id`,
    [session.userId, file.name, names.length]
  );
  const jobId = jobRow!.id;

  const companyIds: number[] = [];
  const providerKeys = {
    apollo: await getProviderKey(session.userId, "apollo"),
    hunter: await getProviderKey(session.userId, "hunter"),
  };
  for (const name of names) {
    const company = await createCompany({ name, status: "processing", created_by: session.userId });
    const result = await runRealEnrichment(name, "name");
    const providerContacts = await enrichContactsFromProviders({
      companyName: name,
      website: result.website,
      query: name,
      keys: providerKeys,
    });
    result.contacts.push(...providerContacts);
    await updateCompany(company.id, {
      website: result.website,
      industry: result.industry,
      gst: result.gst,
      address: result.address,
      city: result.city,
      state: result.state,
      country: result.country,
      employees: result.employees,
      founded: result.founded,
      summary: result.summary,
      lead_score: result.leadScore,
      priority_score: result.priorityScore,
      confidence_score: result.confidenceScore,
      status: "complete",
    });
    for (const c of result.contacts) {
      await addContact({
        company_id: company.id,
        name: c.name,
        designation: c.designation,
        department: c.department,
        business_email: c.businessEmail,
        business_phone: c.businessPhone,
        linkedin: c.linkedin,
        confidence_score: c.confidenceScore,
        source: c.source,
      });
    }
    await upsertSocial({ company_id: company.id, ...result.social });
    await upsertTech({ company_id: company.id, ...result.technologies });
    companyIds.push(company.id);
  }

  await run("UPDATE bulk_jobs SET processed_rows = $1, status = 'complete' WHERE id = $2", [
    names.length,
    jobId,
  ]);

  return NextResponse.json({ jobId, processed: names.length, companyIds });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const jobs = await all("SELECT * FROM bulk_jobs ORDER BY created_at DESC LIMIT 20");
  return NextResponse.json({ jobs });
}