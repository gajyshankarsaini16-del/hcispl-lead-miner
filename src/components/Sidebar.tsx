"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  UploadCloud,
  History,
  BarChart3,
  Download,
  Settings,
  Users,
  KeyRound,
  LogOut,
  PlugZap,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/search", label: "Company Search", icon: Search },
  { href: "/bulk-upload", label: "Bulk Upload", icon: UploadCloud },
  { href: "/history", label: "Search History", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/exports", label: "Exports", icon: Download },
  { href: "/integrations", label: "Integrations", icon: PlugZap },
];

const NAV_ADMIN = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/users", label: "Users", icon: Users },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
];

export function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = userRole === "admin";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-ink text-text-inverse">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-[10px] tracking-[0.25em] text-text-inverse-muted font-data">HCISPL</div>
        <div className="font-display text-lg font-semibold">Lead Miner</div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin py-4 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-white/10 text-text-inverse font-medium"
                  : "text-text-inverse-muted hover:bg-white/5 hover:text-text-inverse"
              }`}
            >
              <Icon size={16} strokeWidth={2} className={active ? "text-brass" : ""} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="px-3 pb-2 text-[10px] tracking-[0.15em] text-text-inverse-muted/70 font-data">
              ADMIN
            </div>
            {NAV_ADMIN.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-white/10 text-text-inverse font-medium"
                      : "text-text-inverse-muted hover:bg-white/5 hover:text-text-inverse"
                  }`}
                >
                  <Icon size={16} strokeWidth={2} className={active ? "text-brass" : ""} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-brass/20 text-brass flex items-center justify-center text-xs font-medium font-data shrink-0">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm truncate">{userName}</div>
            <div className="text-[11px] text-text-inverse-muted capitalize">{userRole}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-text-inverse-muted hover:bg-white/5 hover:text-text-inverse transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}