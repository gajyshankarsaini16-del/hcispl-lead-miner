import { db } from "./db";

export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type Company = {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  gst: string | null;
  cin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  employees: string | null;
  revenue: string | null;
  founded: string | null;
  summary: string | null;
  lead_score: number;
  priority_score: number;
  confidence_score: number;
  status: "queued" | "processing" | "complete" | "failed";
  created_by: number | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: number;
  company_id: number;
  name: string;
  designation: string | null;
  department: string | null;
  business_email: string | null;
  business_phone: string | null;
  linkedin: string | null;
  confidence_score: number;
  source: string | null;
};

export type SocialProfile = {
  company_id: number;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  x: string | null;
  youtube: string | null;
};

export type Technologies = {
  company_id: number;
  firewall: string | null;
  cloud: string | null;
  email: string | null;
  erp: string | null;
  crm: string | null;
  hosting: string | null;
  analytics: string | null;
  cdn: string | null;
  cms: string | null;
};

// ---- Users ----

export function getUserByEmail(email: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  status?: "pending" | "approved" | "rejected";
}) {
  const stmt = db.prepare(
    "INSERT INTO users (name, email, password_hash, role, status) VALUES (@name, @email, @passwordHash, @role, @status)"
  );
  const info = stmt.run({
    ...input,
    role: input.role ?? "member",
    status: input.status ?? "pending",
  });
  return getUserById(Number(info.lastInsertRowid))!;
}

export function countUsers(): number {
  const row = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  return row.c;
}

export function setUserStatus(id: number, status: "pending" | "approved" | "rejected") {
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, id);
  return getUserById(id);
}

export function listPendingUsers(): Omit<User, "password_hash">[] {
  return db
    .prepare(
      "SELECT id, name, email, role, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at ASC"
    )
    .all() as Omit<User, "password_hash">[];
}

export function listAllUsers(): Omit<User, "password_hash">[] {
  return db
    .prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at ASC")
    .all() as Omit<User, "password_hash">[];
}

// ---- Companies ----

export function listCompanies(opts: { search?: string; limit?: number } = {}): Company[] {
  const limit = opts.limit ?? 50;
  if (opts.search) {
    return db
      .prepare("SELECT * FROM companies WHERE name LIKE ? ORDER BY created_at DESC LIMIT ?")
      .all(`%${opts.search}%`, limit) as Company[];
  }
  return db
    .prepare("SELECT * FROM companies ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Company[];
}

export function getCompanyById(id: number): Company | undefined {
  return db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Company | undefined;
}

export function getCompanyStats() {
  const total = db.prepare("SELECT COUNT(*) as c FROM companies").get() as { c: number };

  const complete = db
    .prepare("SELECT COUNT(*) as c FROM companies WHERE status = 'complete'")
    .get() as { c: number };

  const avgLead = db
    .prepare("SELECT AVG(lead_score) as a FROM companies WHERE status = 'complete'")
    .get() as { a: number | null };

  const highPriority = db
    .prepare("SELECT COUNT(*) as c FROM companies WHERE priority_score >= 70")
    .get() as { c: number };

  return {
    total: total.c,
    complete: complete.c,
    avgLeadScore: avgLead.a ? Math.round(avgLead.a) : 0,
    highPriority: highPriority.c,
  };
}

export function createCompany(input: Partial<Company> & { name: string; created_by?: number }) {
  const stmt = db.prepare(
    "INSERT INTO companies (name, website, industry, status, created_by) VALUES (@name, @website, @industry, @status, @created_by)"
  );
  const info = stmt.run({
    name: input.name,
    website: input.website ?? null,
    industry: input.industry ?? null,
    status: input.status ?? "queued",
    created_by: input.created_by ?? null,
  });
  return getCompanyById(Number(info.lastInsertRowid))!;
}

export function updateCompany(id: number, fields: Partial<Company>) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return getCompanyById(id);
  const assignments = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(
    `UPDATE companies SET ${assignments}, updated_at = datetime('now') WHERE id = @id`
  ).run({
    ...fields,
    id,
  });
  return getCompanyById(id);
}

// ---- Contacts / Social / Technologies ----

export function getContactsForCompany(companyId: number): Contact[] {
  return db.prepare("SELECT * FROM contacts WHERE company_id = ?").all(companyId) as Contact[];
}

export function addContact(input: Omit<Contact, "id">) {
  const stmt = db.prepare(
    "INSERT INTO contacts (company_id, name, designation, department, business_email, business_phone, linkedin, confidence_score, source) VALUES (@company_id, @name, @designation, @department, @business_email, @business_phone, @linkedin, @confidence_score, @source)"
  );
  stmt.run(input);
}

export function getSocialForCompany(companyId: number): SocialProfile | undefined {
  return db
    .prepare("SELECT * FROM social_profiles WHERE company_id = ?")
    .get(companyId) as SocialProfile | undefined;
}

export function upsertSocial(input: SocialProfile) {
  db.prepare(
    "INSERT INTO social_profiles (company_id, linkedin, facebook, instagram, x, youtube) VALUES (@company_id, @linkedin, @facebook, @instagram, @x, @youtube) ON CONFLICT(company_id) DO UPDATE SET linkedin=excluded.linkedin, facebook=excluded.facebook, instagram=excluded.instagram, x=excluded.x, youtube=excluded.youtube"
  ).run(input);
}

export function getTechForCompany(companyId: number): Technologies | undefined {
  return db
    .prepare("SELECT * FROM technologies WHERE company_id = ?")
    .get(companyId) as Technologies | undefined;
}

export function upsertTech(input: Technologies) {
  db.prepare(
    "INSERT INTO technologies (company_id, firewall, cloud, email, erp, crm, hosting, analytics, cdn, cms) VALUES (@company_id, @firewall, @cloud, @email, @erp, @crm, @hosting, @analytics, @cdn, @cms) ON CONFLICT(company_id) DO UPDATE SET firewall=excluded.firewall, cloud=excluded.cloud, email=excluded.email, erp=excluded.erp, crm=excluded.crm, hosting=excluded.hosting, analytics=excluded.analytics, cdn=excluded.cdn, cms=excluded.cms"
  ).run(input);
}

// ---- Search history ----

export function logSearch(input: { userId: number; query: string; queryType: string; companyId?: number }) {
  db.prepare(
    "INSERT INTO search_history (user_id, query, query_type, company_id) VALUES (@userId, @query, @queryType, @companyId)"
  ).run({ ...input, companyId: input.companyId ?? null });
}

export function listSearchHistory(limit = 20) {
  return db
    .prepare(
      "SELECT sh.*, c.name as company_name, c.status as company_status FROM search_history sh LEFT JOIN companies c ON c.id = sh.company_id ORDER BY sh.created_at DESC LIMIT ?"
    )
    .all(limit);
}

export function getIndustryBreakdown(): Array<{ industry: string; count: number }> {
  return db
    .prepare(
      "SELECT COALESCE(industry, 'Unclassified') as industry, COUNT(*) as count FROM companies GROUP BY industry ORDER BY count DESC LIMIT 10"
    )
    .all() as Array<{ industry: string; count: number }>;
}

export function getScoreDistribution(): { high: number; mid: number; low: number } {
  const high = db
    .prepare("SELECT COUNT(*) as c FROM companies WHERE lead_score >= 70")
    .get() as { c: number };
  const mid = db
    .prepare("SELECT COUNT(*) as c FROM companies WHERE lead_score >= 40 AND lead_score < 70")
    .get() as { c: number };
  const low = db
    .prepare("SELECT COUNT(*) as c FROM companies WHERE lead_score < 40")
    .get() as { c: number };

  return { high: high.c, mid: mid.c, low: low.c };
}
