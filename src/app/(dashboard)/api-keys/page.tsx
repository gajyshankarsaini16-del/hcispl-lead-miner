"use client";

import { useEffect, useState } from "react";
import { KeyRound, Copy, Trash2 } from "lucide-react";

type ApiKey = { id: number; label: string; key_prefix: string; created_at: string; last_used_at: string | null };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/api-keys");
    if (res.ok) setKeys((await res.json()).keys);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    if (!label.trim()) return;
    setLoading(true);
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.key);
      setLabel("");
      refresh();
    }
  }

  async function handleRevoke(id: number) {
    await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">API keys</h1>
      <p className="mt-1 text-sm text-text-muted max-w-lg">
        Keys for calling the Lead Miner API from external tools. Storage and hashing are
        wired up; there's no API surface consuming them yet — that's the Phase 1{" "}
        <span className="font-data">API</span> deliverable to build next.
      </p>

      <div className="mt-6 flex gap-2 max-w-md">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Key label, e.g. Zapier integration"
          className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:border-brass"
        />
        <button
          onClick={handleCreate}
          disabled={loading || !label.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-text-inverse hover:bg-ink-soft transition-colors disabled:opacity-60"
        >
          <KeyRound size={14} /> Generate
        </button>
      </div>

      {newKey && (
        <div className="mt-4 max-w-lg rounded-md border border-brass/40 bg-brass/5 px-4 py-3">
          <div className="text-xs text-text-muted mb-1.5">
            Copy this now — you won&apos;t be able to see it again.
          </div>
          <div className="flex items-center justify-between gap-2">
            <code className="font-data text-xs text-text break-all">{newKey}</code>
            <button
              onClick={() => navigator.clipboard.writeText(newKey)}
              className="shrink-0 p-1.5 rounded-md hover:bg-brass/10 text-brass-strong"
              title="Copy"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-line bg-card overflow-hidden max-w-2xl">
        {keys.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-muted">No API keys yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-text-muted">
                <th className="px-5 py-2.5 font-medium">Label</th>
                <th className="px-5 py-2.5 font-medium">Prefix</th>
                <th className="px-5 py-2.5 font-medium">Created</th>
                <th className="px-5 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="px-5 py-3 text-text">{k.label}</td>
                  <td className="px-5 py-3 font-data text-xs text-text-muted">lm_{k.key_prefix}…</td>
                  <td className="px-5 py-3 text-xs text-text-muted font-data">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(k.id)}
                      className="text-text-muted hover:text-rust"
                      title="Revoke"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
