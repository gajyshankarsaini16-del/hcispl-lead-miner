"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@hcispl.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't sign you in.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-ink">
      {/* Left: brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-text-inverse overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 39px, #ede9dd 39px, #ede9dd 40px)",
          }}
        />
        <div className="relative">
          <div className="text-xs tracking-[0.25em] text-text-inverse-muted font-data">HCISPL</div>
          <div className="mt-1 font-display text-2xl font-semibold">Lead Miner</div>
        </div>

        <div className="relative max-w-sm">
          <div className="flex items-end gap-3 mb-6">
            {/* Core-sample signature mark: layered bars = layered intelligence (contacts, tech, social, score) */}
            {[
              { h: 34, c: "var(--tier-low)" },
              { h: 58, c: "var(--brass)" },
              { h: 88, c: "var(--tier-high)" },
              { h: 46, c: "var(--brass)" },
            ].map((bar, i) => (
              <div
                key={i}
                className="w-3 rounded-[2px]"
                style={{ height: bar.h, background: bar.c }}
              />
            ))}
          </div>
          <p className="font-display text-xl leading-snug">
            Every public signal, drilled into one profile.
          </p>
          <p className="mt-3 text-sm text-text-inverse-muted leading-relaxed">
            Search a company or upload a list. Lead Miner pulls together contacts, tech
            stack, and social presence from public sources, scores the fit, and hands
            you an export-ready profile.
          </p>
        </div>

        <div className="relative text-xs text-text-inverse-muted font-data">
          v1.0 · Phase 1
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <div className="text-xs tracking-[0.25em] text-text-muted font-data">HCISPL</div>
            <div className="font-display text-xl font-semibold">Lead Miner</div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-text">Sign in</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Use your team account to access the platform.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-text-muted mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-brass"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-text-muted mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-brass"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-md border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-ink-soft disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-xs text-text-muted">
            First run? Seed a demo account with{" "}
            <code className="font-data text-[11px] bg-line-soft px-1.5 py-0.5 rounded">npm run seed</code> —
            <span className="font-data"> admin@hcispl.local / admin123</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
