import { NextRequest, NextResponse } from "next/server";
import { getCompanyById, getContactsForCompany, getSocialForCompany, getTechForCompany } from "@/lib/repo";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = Number(id);
  const company = await getCompanyById(companyId);
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  return NextResponse.json({
    company,
    contacts: await getContactsForCompany(companyId),
    social: (await getSocialForCompany(companyId)) ?? null,
    technologies: (await getTechForCompany(companyId)) ?? null,
  });
}
