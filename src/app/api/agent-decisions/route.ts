/**
 * API route for Agent Decision Log (last N decisions)
 */
import { getLastDecisions } from "@/lib/archestra/decision-log";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 10)) : 10;

  const decisions = getLastDecisions(limit);
  return NextResponse.json({ success: true, decisions });
}
