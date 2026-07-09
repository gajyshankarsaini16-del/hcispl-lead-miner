import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getUserByEmail, createUser } from "@/lib/repo";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

function generateTempPassword() {
  // Readable-ish temp password, e.g. "hc7f-k29a-qz3m"
  return crypto.randomBytes(6).toString("hex").match(/.{1,4}/g)!.join("-");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Only admins can add contacts/users." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const { name, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const user = await createUser({ name, email, passwordHash, role, status: "approved" });

  // No email service is wired up yet, so the temp password is returned once
  // here for the admin to share with the person directly.
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email }, tempPassword });
}
