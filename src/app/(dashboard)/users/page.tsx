import { getSession } from "@/lib/session";
import { listAllUsers } from "@/lib/repo";

export default async function UsersPage() {
  const session = await getSession();
  const users = listAllUsers();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Users</h1>
      <p className="mt-1 text-sm text-text-muted">Everyone with access to this workspace.</p>

      {session?.role !== "admin" ? (
        <div className="mt-6 rounded-lg border border-rust/30 bg-rust/5 px-5 py-4 text-sm text-rust max-w-md">
          Only admins can manage users.
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-line bg-card overflow-hidden max-w-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-text-muted">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Role</th>
                <th className="px-5 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 text-text">{u.name}</td>
                  <td className="px-5 py-3 text-text-muted">{u.email}</td>
                  <td className="px-5 py-3 text-text-muted capitalize">{u.role}</td>
                  <td className="px-5 py-3 text-xs text-text-muted font-data">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 max-w-2xl rounded-lg border border-line-soft bg-line-soft/40 px-4 py-3 text-xs text-text-muted leading-relaxed">
        Inviting new users and role-based access control (from the SRS coding standards)
        aren't wired up in this Phase 1 build — the schema and admin check are in place,
        so it's a small next step.
      </div>
    </div>
  );
}
