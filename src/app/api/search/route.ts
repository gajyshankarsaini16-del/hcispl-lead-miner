import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  createCompany,
  updateCompany,
  addContact,
  upsertSocial,
  upsertTech,
  logSearch,
} from "@/lib/repo";
import { runRealEnrichment } from "@/lib/realScraper";
import { enrichContactsFromProviders, refineContactsWithEmailFinders } from "@/lib/contactProviders";
import { getProviderKey } from "@/lib/providerKeys";

const schema = z.object({
  query: z.string().min(2),
  queryType: z.enum(["name", "website", "gst", "cin", "linkedin"]).default("name"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a company name, website, GST, CIN, or LinkedIn URL." }, { status: 400 });
  }

  const { query, queryType } = parsed.data;

  const company = await createCompany({ name: query, status: "processing", created_by: session.userId });
  const result = await runRealEnrichment(query, queryType);
  const providerContacts = await enrichContactsFromProviders({
    companyName: query,
    website: result.website,
    query,
    keys: {
      apollo: await getProviderKey(session.userId, "apollo"),
      hunter: await getProviderKey(session.userId, "hunter"),
    },
  });
  result.contacts.push(...providerContacts);

  const domain = result.website ? new URL(result.website).hostname.replace(/^www\./, "") : null;
  await refineContactsWithEmailFinders(result.contacts, domain, await getProviderKey(session.userId, "hunter"));


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

  await logSearch({ userId: session.userId, query, queryType, companyId: company.id });

  return NextResponse.json({ companyId: company.id });
}