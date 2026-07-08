import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const keys = db
    .prepare("SELECT id, label, key_prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC")
    .all(session.userId);
  return NextResponse.json({ keys });
}

const schema = z.object({ label: z.string().min(1).max(60) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Give the key a label." }, { status: 400 });

  const secret = crypto.randomBytes(24).toString("base64url");
  const prefix = secret.slice(0, 8);
  const fullKey = `lm_${secret}`;
  const keyHash = await hashPassword(fullKey);

  db.prepare(
    "INSERT INTO api_keys (user_id, label, key_prefix, key_hash) VALUES (?, ?, ?, ?)"
  ).run(session.userId, parsed.data.label, prefix, keyHash);

  // Full key is only ever returned here — the caller must store it now.
  return NextResponse.json({ key: fullKey, prefix });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing key id." }, { status: 400 });
  db.prepare("DELETE FROM api_keys WHERE id = ? AND user_id = ?").run(Number(id), session.userId);
  return NextResponse.json({ ok: true });
}
