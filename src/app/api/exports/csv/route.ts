import { NextResponse } from "next/server";
import { listCompanies, getContactsForCompany, getSocialForCompany, getTechForCompany } from "@/lib/repo";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function findContact(contacts: ReturnType<typeof getContactsForCompany>, match: (d: string) => boolean) {
  return contacts.find((c) => match((c.designation || "").toLowerCase()));
}

export async function GET() {
  const companies = listCompanies({ limit: 5000 });

  const headers = [
    "Company Name",
    "Website",
    "Founder",
    "CTO",
    "IT Head",
    "Admin",
    "Director",
    "COO",
    "HR Head",
    "Contact No.",
    "Email",
    "LinkedIn",
    "Instagram",
    "Facebook",
    "GST No.",
    "Industry",
    "CIN",
    "Address",
    "Technologies",
    "Lead Score",
    "Remarks",
  ];

  const rows = companies.map((c) => {
    const contacts = getContactsForCompany(c.id);
    const social = getSocialForCompany(c.id);
    const tech = getTechForCompany(c.id);

    const founder = findContact(contacts, (d) => d.includes("founder") || d.includes("co-founder"));
    const cto = findContact(contacts, (d) => d.includes("cto"));
    const itHead = findContact(contacts, (d) => d.includes("it head") || d.includes("it manager"));
    const admin = findContact(contacts, (d) => d.includes("admin"));
    const director = findContact(contacts, (d) => d.includes("director"));
    const coo = findContact(contacts, (d) => d.includes("coo") || d.includes("chief operating officer"));
    const hrHead = findContact(contacts, (d) => d.includes("hr head") || d.includes("human resources"));
    const primaryContact = founder ?? director ?? contacts[0];

    const techSummary = tech
      ? [tech.cloud, tech.crm, tech.erp].filter(Boolean).join(" / ")
      : "";

    return [
      c.name,
      c.website,
      founder?.name ?? "",
      cto?.name ?? "",
      itHead?.name ?? "",
      admin?.name ?? "",
      director?.name ?? "",
      coo?.name ?? "",
      hrHead?.name ?? "",
      primaryContact?.business_phone ?? "",
      primaryContact?.business_email ?? "",
      social?.linkedin ?? "",
      social?.instagram ?? "",
      social?.facebook ?? "",
      c.gst,
      c.industry,
      c.cin,
      [c.address, c.city, c.state, c.country].filter(Boolean).join(", "),
      techSummary,
      c.lead_score,
      c.status,
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lead-miner-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
