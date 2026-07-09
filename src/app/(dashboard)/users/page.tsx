"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: number, status: "approved" | "rejected") {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) return <div className="text-sm text-text-muted">Loading users…</div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text mb-1">Users</h1>
      <p className="text-sm text-text-muted mb-6">Approve or reject new sign-ups.</p>

      <div className="rounded-lg border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5">Name</th>
              <th className="text-left px-4 py-2.5">Email</th>
              <th className="text-left px-4 py-2.5">Role</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">Joined</th>
              <th className="text-right px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-2.5">{u.name}</td>
                <td className="px-4 py-2.5">{u.email}</td>
                <td className="px-4 py-2.5 capitalize">{u.role}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                      u.status === "approved"
                        ? "bg-tier-high/15 text-tier-high"
                        : u.status === "rejected"
                        ? "bg-rust/15 text-rust"
                        : "bg-brass/15 text-brass"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-right space-x-2">
                  {u.status !== "approved" && (
                    <button
                      onClick={() => updateStatus(u.id, "approved")}
                      className="text-xs px-2.5 py-1 rounded-md bg-ink text-text-inverse hover:bg-ink-soft"
                    >
                      Approve
                    </button>
                  )}
                  {u.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(u.id, "rejected")}
                      className="text-xs px-2.5 py-1 rounded-md border border-line hover:bg-card"
                    >
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
