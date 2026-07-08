import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/repo";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "hcispl-bootstrap-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = "Gajy.admin@HCISPL.com";
  let admin = getUserByEmail(email);
  if (!admin) {
    const passwordHash = await hashPassword("admin123");
    admin = createUser({ name: "Admin", email, passwordHash, role: "admin", status: "approved" });
    return NextResponse.json({ ok: true, created: true });
  }
  return NextResponse.json({ ok: true, created: false, message: "Admin already exists" });
}
