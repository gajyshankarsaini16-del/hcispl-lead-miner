import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listAllUsers } from "@/lib/repo";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ users: await listAllUsers() });
}
