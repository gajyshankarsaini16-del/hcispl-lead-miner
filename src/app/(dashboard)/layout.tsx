import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar userName={session.name} userRole={session.role} />
      <main className="flex-1 min-w-0 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}
