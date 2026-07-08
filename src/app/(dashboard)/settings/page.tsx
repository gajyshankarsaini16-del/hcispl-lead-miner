import { getSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Settings</h1>
      <p className="mt-1 text-sm text-text-muted">Account and workspace configuration.</p>

      <div className="mt-6 max-w-md rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-sm font-semibold text-text mb-4">Your account</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Name</dt>
            <dd className="text-text">{session?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Email</dt>
            <dd className="text-text">{session?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Role</dt>
            <dd className="text-text capitalize">{session?.role}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 max-w-md rounded-lg border border-line-soft bg-line-soft/40 px-4 py-3 text-xs text-text-muted leading-relaxed">
        Workspace-level settings (branding, scoring weights, data retention, integrations)
        aren't wired up yet — add them here as you build out later phases.
      </div>
    </div>
  );
}
