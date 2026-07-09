import { NextRequest, NextResponse } from "next/server";
import { listCompanies } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q") ?? undefined;
  const companies = await listCompanies({ search });
  return NextResponse.json({ companies });
}