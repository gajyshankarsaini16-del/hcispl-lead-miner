import { all, get, run } from "@/lib/db";

export type Provider = "apollo" | "hunter";

export type ProviderKeyInfo = {
  provider: Provider;
  key_prefix: string;
  created_at: string;
  updated_at: string;
};

export async function getProviderKey(userId: number, provider: Provider): Promise<string | null> {
  const row = await get<{ api_key: string }>(
    "SELECT api_key FROM provider_api_keys WHERE user_id = $1 AND provider = $2",
    [userId, provider]
  );
  return row?.api_key ?? null;
}

export async function listProviderKeys(userId: number): Promise<ProviderKeyInfo[]> {
  return all<ProviderKeyInfo>(
    "SELECT provider, key_prefix, created_at, updated_at FROM provider_api_keys WHERE user_id = $1 ORDER BY provider ASC",
    [userId]
  );
}

export async function saveProviderKey(userId: number, provider: Provider, apiKey: string): Promise<void> {
  const key = apiKey.trim();
  const prefix = key.slice(0, 6);
  await run(
    `INSERT INTO provider_api_keys (user_id, provider, api_key, key_prefix)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, provider) DO UPDATE SET
       api_key = excluded.api_key,
       key_prefix = excluded.key_prefix,
       updated_at = NOW()`,
    [userId, provider, key, prefix]
  );
}

export async function deleteProviderKey(userId: number, provider: Provider): Promise<void> {
  await run("DELETE FROM provider_api_keys WHERE user_id = $1 AND provider = $2", [userId, provider]);
}