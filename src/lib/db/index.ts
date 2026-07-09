import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";

// Persistent Postgres (Neon) connection — required so data and logins
// survive across deploys and cold starts on Vercel.
//   DATABASE_URL = postgres://<user>:<password>@<host>.neon.tech/<db>?sslmode=require
// Get this from the Neon console (console.neon.tech) → your project → Connection string.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add your Neon Postgres connection string as an environment " +
      "variable (locally in .env, and in Vercel under Project Settings → Environment Variables)."
  );
}

export const sql = neon(connectionString);

declare global {
  // eslint-disable-next-line no-var
  var __leadMinerMigrated: Promise<void> | undefined;
}

async function migrate() {
  const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Run each statement separately — the neon http driver doesn't support
  // multi-statement strings the way a local sqlite/pg client connection does.
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }
}

// Ensures tables exist before any query runs — only migrates once per process.
export function ready(): Promise<void> {
  if (!global.__leadMinerMigrated) {
    global.__leadMinerMigrated = migrate();
  }
  return global.__leadMinerMigrated;
}

// ---- Small query helpers used throughout repo.ts ----
// Postgres uses positional $1, $2... placeholders (not sqlite's ? or @name).

export async function all<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  const rows = await sql.query(text, params);
  return rows as T[];
}

export async function get<T = unknown>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await all<T>(text, params);
  return rows[0];
}

export async function run(text: string, params: unknown[] = []): Promise<void> {
  await ready();
  await sql.query(text, params);
}
