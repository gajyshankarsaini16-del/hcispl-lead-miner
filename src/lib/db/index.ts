import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Singleton so hot-reload in dev doesn't open the file repeatedly.
declare global {
  // eslint-disable-next-line no-var
  var __leadMinerDb: Database.Database | undefined;
}

const DB_PATH = path.join(process.cwd(), "data", "leadminer.db");

function createConnection() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);

  // Lightweight migration: older DB files won't have the users.status column yet.
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.some((c) => c.name === "status")) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'");
  }

  return db;
}

export const db = global.__leadMinerDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  global.__leadMinerDb = db;
}
