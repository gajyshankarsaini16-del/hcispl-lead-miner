import { NextResponse } from "next/server";
import { getCompanyStats, listSearchHistory } from "@/lib/repo";

export async function GET() {
  return NextResponse.json({
    stats: await getCompanyStats(),
    recent: await listSearchHistory(8),
  });
}
