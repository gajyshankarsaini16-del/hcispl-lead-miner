import { getSession } from "@/lib/session";
import { UsersTable } from "./UsersTable";

export default async function UsersPage() {
  const session = await getSession();

  return <UsersTable currentUserId={session?.userId ?? 0} />;
}