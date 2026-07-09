import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, createUser } from "@/lib/repo";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid name, email and password (6+ chars)." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  await createUser({ name, email, passwordHash, role: "member", status: "pending" });

  return NextResponse.json({
    ok: true,
    message: "Account created. An admin needs to approve you before you can sign in.",
  });
}
