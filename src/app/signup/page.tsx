"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't create account.");
      return;
    }
    setSuccess(data.message ?? "Account created. Wait for admin approval.");
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-text">Create account</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Your account needs admin approval before you can sign in.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm"
            />
          </div>

          {error && <div className="rounded-md border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">{error}</div>}
          {success && <div className="rounded-md border border-tier-high/30 bg-tier-high/5 px-3 py-2 text-sm text-tier-high">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-text-inverse hover:bg-ink-soft disabled:opacity-60"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
