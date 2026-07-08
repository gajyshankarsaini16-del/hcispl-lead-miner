"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, PlugZap, Trash2 } from "lucide-react";

type Provider = "apollo" | "hunter";
type Integration = { provider: Provider; key_prefix: string; created_at: string; updated_at: string };

const PROVIDERS: Array<{
  id: Provider;
  name: string;
  bestFor: string;
  note: string;
}> = [
  {
    id: "apollo",
    name: "Apollo",
    bestFor: "Person names, titles, work emails, some phones",
    note: "Best match for Founder, CTO, IT Head, Director, COO, and HR Head searches.",
  },
  {
    id: "hunter",
    name: "Hunter",
    bestFor: "Company-domain email discovery",
    note: "Good fallback for work emails from a company website domain; phone numbers are not its strength.",
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [provider, setProvider] = useState<Provider>("apollo");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const connected = useMemo(
    () => new Map(integrations.map((item) => [item.provider, item])),
    [integrations]
  );

  async function refresh() {
    const res = await fetch("/api/integrations");
    if (res.ok) setIntegrations((await res.json()).integrations);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    setMessage(null);
    if (!apiKey.trim()) return;
    setSaving(true);
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Could not save integration.");
      return;
    }
    setApiKey("");
    setMessage(`${PROVIDERS.find((p) => p.id === provider)?.name} connected.`);
    refresh();
  }

  async function remove(providerId: Provider) {
    await fetch(`/api/integrations?provider=${providerId}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Integrations</h1>
      <p className="mt-1 text-sm text-text-muted max-w-2xl">
        Connect a data provider once, then use Company Search and Bulk Upload inside Lead Miner.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((item) => {
          const status = connected.get(item.id);
          return (
            <div key={item.id} className="rounded-lg border border-line bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <PlugZap size={16} className="text-brass-strong" />
                    <h2 className="font-display text-base font-semibold text-text">{item.name}</h2>
                  </div>
                  <p className="mt-2 text-sm text-text">{item.bestFor}</p>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed">{item.note}</p>
                </div>
                {status ? (
                  <button
                    onClick={() => remove(item.id)}
                    className="rounded-md p-1.5 text-text-muted hover:bg-rust/5 hover:text-rust"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>

              <div className="mt-4 rounded-md border border-line-soft bg-line-soft/40 px-3 py-2 text-xs text-text-muted">
                {status ? (
                  <span>
                    Connected key: <span className="font-data">{status.key_prefix}...</span>
                  </span>
                ) : (
                  "Not connected"
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 max-w-2xl rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-semibold text-text">Add provider key</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_auto]">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-text focus:border-brass"
          >
            {PROVIDERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API key"
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:border-brass"
          />
          <button
            onClick={save}
            disabled={saving || !apiKey.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-text-inverse hover:bg-ink-soft transition-colors disabled:opacity-60"
          >
            <KeyRound size={14} /> Save
          </button>
        </div>
        {message && <div className="mt-3 text-sm text-text-muted">{message}</div>}
      </div>
    </div>
  );
}
