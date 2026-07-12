import { all, get, run } from "./db";

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

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return get<User>("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
}

export async function getUserById(id: number): Promise<User | undefined> {
  return get<User>("SELECT * FROM users WHERE id = $1", [id]);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  status?: "pending" | "approved" | "rejected";
}): Promise<User> {
  const row = await get<{ id: number }>(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      input.name,
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.role ?? "member",
      input.status ?? "pending",
    ]
  );
  return (await getUserById(row!.id))!;
}

export async function countUsers(): Promise<number> {
  const row = await get<{ c: number }>("SELECT COUNT(*) as c FROM users");
  return Number(row?.c ?? 0);
}

export async function setUserStatus(
  id: number,
  status: "pending" | "approved" | "rejected"
): Promise<User | undefined> {
  await run("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
  return getUserById(id);
}

export async function listPendingUsers(): Promise<Omit<User, "password_hash">[]> {
  return all<Omit<User, "password_hash">>(
    "SELECT id, name, email, role, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at ASC"
  );
}

export async function listAllUsers(): Promise<Omit<User, "password_hash">[]> {
  return all<Omit<User, "password_hash">>(
    "SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at ASC"
  );
}

// ---- Companies ----

export async function listCompanies(opts: { search?: string; limit?: number } = {}): Promise<Company[]> {
  const limit = opts.limit ?? 50;
  if (opts.search) {
    return all<Company>("SELECT * FROM companies WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT $2", [
      `%${opts.search}%`,
      limit,
    ]);
  }
  return all<Company>("SELECT * FROM companies ORDER BY created_at DESC LIMIT $1", [limit]);
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  return get<Company>("SELECT * FROM companies WHERE id = $1", [id]);
}

export async function getCompanyStats() {
  const total = await get<{ c: number }>("SELECT COUNT(*) as c FROM companies");
  const complete = await get<{ c: number }>("SELECT COUNT(*) as c FROM companies WHERE status = 'complete'");
  const avgLead = await get<{ a: number | null }>(
    "SELECT AVG(lead_score) as a FROM companies WHERE status = 'complete'"
  );
  const highPriority = await get<{ c: number }>(
    "SELECT COUNT(*) as c FROM companies WHERE priority_score >= 70"
  );

  return {
    total: Number(total?.c ?? 0),
    complete: Number(complete?.c ?? 0),
    avgLeadScore: avgLead?.a ? Math.round(Number(avgLead.a)) : 0,
    highPriority: Number(highPriority?.c ?? 0),
  };
}

export async function createCompany(
  input: Partial<Company> & { name: string; created_by?: number }
): Promise<Company> {
  const row = await get<{ id: number }>(
    `INSERT INTO companies (name, website, industry, status, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      input.name,
      input.website ?? null,
      input.industry ?? null,
      input.status ?? "queued",
      input.created_by ?? null,
    ]
  );
  return (await getCompanyById(row!.id))!;
}

export async function updateCompany(id: number, fields: Partial<Company>): Promise<Company | undefined> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return getCompanyById(id);
  const assignments = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => (fields as Record<string, unknown>)[k]);
  await run(`UPDATE companies SET ${assignments}, updated_at = NOW() WHERE id = $${keys.length + 1}`, [
    ...values,
    id,
  ]);
  return getCompanyById(id);
}

// ---- Contacts / Social / Technologies ----

export async function getContactsForCompany(companyId: number): Promise<Contact[]> {
  return all<Contact>("SELECT * FROM contacts WHERE company_id = $1", [companyId]);
}

export async function addContact(input: Omit<Contact, "id">): Promise<void> {
  await run(
    `INSERT INTO contacts (company_id, name, designation, department, business_email, business_phone, linkedin, confidence_score, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.company_id,
      input.name,
      input.designation,
      input.department,
      input.business_email,
      input.business_phone,
      input.linkedin,
      input.confidence_score,
      input.source,
    ]
  );
}

export async function getSocialForCompany(companyId: number): Promise<SocialProfile | undefined> {
  return get<SocialProfile>("SELECT * FROM social_profiles WHERE company_id = $1", [companyId]);
}

export async function upsertSocial(input: SocialProfile): Promise<void> {
  await run(
    `INSERT INTO social_profiles (company_id, linkedin, facebook, instagram, x, youtube)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (company_id) DO UPDATE SET
       linkedin = excluded.linkedin, facebook = excluded.facebook, instagram = excluded.instagram,
       x = excluded.x, youtube = excluded.youtube`,
    [input.company_id, input.linkedin, input.facebook, input.instagram, input.x, input.youtube]
  );
}

export async function getTechForCompany(companyId: number): Promise<Technologies | undefined> {
  return get<Technologies>("SELECT * FROM technologies WHERE company_id = $1", [companyId]);
}

export async function upsertTech(input: Technologies): Promise<void> {
  await run(
    `INSERT INTO technologies (company_id, firewall, cloud, email, erp, crm, hosting, analytics, cdn, cms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (company_id) DO UPDATE SET
       firewall = excluded.firewall, cloud = excluded.cloud, email = excluded.email, erp = excluded.erp,
       crm = excluded.crm, hosting = excluded.hosting, analytics = excluded.analytics,
       cdn = excluded.cdn, cms = excluded.cms`,
    [
      input.company_id,
      input.firewall,
      input.cloud,
      input.email,
      input.erp,
      input.crm,
      input.hosting,
      input.analytics,
      input.cdn,
      input.cms,
    ]
  );
}

// ---- Search history ----

export async function logSearch(input: {
  userId: number;
  query: string;
  queryType: string;
  companyId?: number;
}): Promise<void> {
  await run(
    "INSERT INTO search_history (user_id, query, query_type, company_id) VALUES ($1, $2, $3, $4)",
    [input.userId, input.query, input.queryType, input.companyId ?? null]
  );
}

export async function listSearchHistory(limit = 20) {
  return all(
    `SELECT sh.*, c.name as company_name, c.status as company_status
     FROM search_history sh LEFT JOIN companies c ON c.id = sh.company_id
     ORDER BY sh.created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getLatestSearchForCompany(
  companyId: number
): Promise<{ query: string; query_type: string } | null> {
  const row = await get<{ query: string; query_type: string }>(
    "SELECT query, query_type FROM search_history WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1",
    [companyId]
  );
  return row ?? null;
}

export async function getIndustryBreakdown(): Promise<Array<{ industry: string; count: number }>> {
  const rows = await all<{ industry: string; count: number }>(
    `SELECT COALESCE(industry, 'Unclassified') as industry, COUNT(*) as count
     FROM companies GROUP BY industry ORDER BY count DESC LIMIT 10`
  );
  return rows.map((r) => ({ industry: r.industry, count: Number(r.count) }));
}

export async function getScoreDistribution(): Promise<{ high: number; mid: number; low: number }> {
  const high = await get<{ c: number }>("SELECT COUNT(*) as c FROM companies WHERE lead_score >= 70");
  const mid = await get<{ c: number }>(
    "SELECT COUNT(*) as c FROM companies WHERE lead_score >= 40 AND lead_score < 70"
  );
  const low = await get<{ c: number }>("SELECT COUNT(*) as c FROM companies WHERE lead_score < 40");

  return { high: Number(high?.c ?? 0), mid: Number(mid?.c ?? 0), low: Number(low?.c ?? 0) };
}

export async function deleteUser(id: number): Promise<void> {
  await run("UPDATE companies SET created_by = NULL WHERE created_by = $1", [id]);
  await run("DELETE FROM search_history WHERE user_id = $1", [id]);
  await run("DELETE FROM bulk_jobs WHERE user_id = $1", [id]);
  await run("DELETE FROM api_keys WHERE user_id = $1", [id]);
  await run("DELETE FROM provider_api_keys WHERE user_id = $1", [id]);
  await run("DELETE FROM users WHERE id = $1", [id]);
}