import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import {
  createUser,
  getUserByEmail,
  createCompany,
  updateCompany,
  addContact,
  upsertSocial,
  upsertTech,
} from "../src/lib/repo";
import { runMockEnrichment } from "../src/lib/mockEngine";

async function main() {
  const email = "Gajy.admin@HCISPL.com";
let admin = getUserByEmail(email);
if (!admin) {
  const passwordHash = await hashPassword("admin123");
  admin = createUser({ name: "Admin", email, passwordHash, role: "admin", status: "approved" });
  console.log(`Created admin user: ${email} / admin123`);
} else {
  console.log("Admin user already exists, skipping.");
}

  const existing = db.prepare("SELECT COUNT(*) as c FROM companies").get() as { c: number };
  if (existing.c > 0) {
    console.log("Companies already seeded, skipping demo data.");
    return;
  }

  const demoNames = ["Vertex Industrial Ltd", "Northbridge Logistics", "Sundari Pharma Pvt Ltd"];
  for (const name of demoNames) {
    const company = createCompany({ name, status: "processing", created_by: admin.id });
    const result = runMockEnrichment(name);
    updateCompany(company.id, {
      website: result.website,
      industry: result.industry,
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
      addContact({
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
    upsertSocial({ company_id: company.id, ...result.social });
    upsertTech({ company_id: company.id, ...result.technologies });
    console.log(`Seeded ${name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
