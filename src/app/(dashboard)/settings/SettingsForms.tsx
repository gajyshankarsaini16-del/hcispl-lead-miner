"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AddContactForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't add that contact.");
        return;
      }
      setCreated({ email: data.user.email, tempPassword: data.tempPassword });
      setName("");
      setEmail("");
      setRole("member");
      router.refresh();
    });
  }

  return (
    <div className="mt-6 max-w-md rounded-lg border border-line bg-card p-5">
      <h2 className="font-display text-sm font-semibold text-text mb-1">Add contact</h2>
      <p className="text-xs text-text-muted mb-4">
        Creates an approved login directly — no signup/approval step needed.
      </p>

      {created && (
        <div className="mb-4 rounded-md border border-emerald-600/30 bg-emerald-600/5 px-3 py-2 text-xs text-emerald-700 leading-relaxed">
          Account created for <strong>{created.email}</strong>. Temporary password:{" "}
          <code className="rounded bg-emerald-600/10 px-1 py-0.5 font-data">{created.tempPassword}</code>
          <br />
          Share this with them now — it won&apos;t be shown again.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 text-xs text-rust">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-brass"
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-brass"
            placeholder="name@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-brass"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-ink px-4 py-2 text-sm font-medium text-text-inverse hover:bg-ink-soft disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add contact"}
        </button>
      </form>
    </div>
  );
}