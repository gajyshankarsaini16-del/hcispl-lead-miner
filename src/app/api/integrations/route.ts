import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { deleteProviderKey, listProviderKeys, saveProviderKey } from "@/lib/providerKeys";

const providerSchema = z.enum(["apollo", "hunter"]);
const saveSchema = z.object({
  provider: providerSchema,
  apiKey: z.string().min(8),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  return NextResponse.json({ integrations: listProviderKeys(session.userId) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a provider and paste a valid API key." }, { status: 400 });
  }

  saveProviderKey(session.userId, parsed.data.provider, parsed.data.apiKey);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const provider = providerSchema.safeParse(req.nextUrl.searchParams.get("provider"));
  if (!provider.success) return NextResponse.json({ error: "Missing provider." }, { status: 400 });

  deleteProviderKey(session.userId, provider.data);
  return NextResponse.json({ ok: true });
}
