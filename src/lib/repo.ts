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
    .prepare("SELECT id, name, email, role, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at ASC")
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
  return db.prepare("SELECT * FROM companies ORDER BY created_at DESC LIMIT ?").all(limit) as Company[];
}

export function getCompanyById(id: number): Company | undefined {
  return db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Company | undefined;
}

export function getCompanyStats() {
  const total = db.prepare("SELECT COUNT(*) as c FROM companies").get() as { c: number };
  const complete = db.prepare("SELECT COUNT(*) as c FROM companies WHERE status = 'complete'").get() as {
    c: number;
  };
  const avgLead = db.prepare("SELECT
