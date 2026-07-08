import { db } from "@/lib/db";

export type Provider = "apollo" | "hunter";

export type ProviderKeyInfo = {
  provider: Provider;
  key_prefix: string;
  created_at: string;
  updated_at: string;
};

export function getProviderKey(userId: number, provider: Provider): string | null {
  const row = db
    .prepare("SELECT api_key FROM provider_api_keys WHERE user_id = ? AND provider = ?")
    .get(userId, provider) as { api_key: string } | undefined;
  return row?.api_key ?? null;
}

export function listProviderKeys(userId: number): ProviderKeyInfo[] {
  return db
    .prepare(
      "SELECT provider, key_prefix, created_at, updated_at FROM provider_api_keys WHERE user_id = ? ORDER BY provider ASC"
    )
    .all(userId) as ProviderKeyInfo[];
}

export function saveProviderKey(userId: number, provider: Provider, apiKey: string) {
  const key = apiKey.trim();
  const prefix = key.slice(0, 6);
  db.prepare(
    `INSERT INTO provider_api_keys (user_id, provider, api_key, key_prefix)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, provider) DO UPDATE SET
       api_key = excluded.api_key,
       key_prefix = excluded.key_prefix,
       updated_at = datetime('now')`
  ).run(userId, provider, key, prefix);
}

export function deleteProviderKey(userId: number, provider: Provider) {
  db.prepare("DELETE FROM provider_api_keys WHERE user_id = ? AND provider = ?").run(userId, provider);
}
