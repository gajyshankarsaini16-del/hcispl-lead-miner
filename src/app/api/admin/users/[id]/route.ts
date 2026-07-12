import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { setUserStatus, getUserById, deleteUser } from "@/lib/repo";

const schema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);
  const target = await getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const updated = await setUserStatus(userId, parsed.data.status);
  return NextResponse.json({ user: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  if (userId === session.userId) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const target = await getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await deleteUser(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("deleteUser failed:", err);
    return NextResponse.json({ error: "Could not delete user due to a database error." }, { status: 500 });
  }