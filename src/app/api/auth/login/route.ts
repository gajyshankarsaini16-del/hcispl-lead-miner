import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail } from "@/lib/repo";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  if (user.status === "pending") {
    return NextResponse.json(
      { error: "Your account is awaiting admin approval." },
      { status: 403 }
    );
  }
  if (user.status === "rejected") {
    return NextResponse.json(
      { error: "Your account access was denied. Contact the admin." },
      { status: 403 }
    );
  }

  await setSessionCookie({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json({ ok: true });
}