/**
 * API route for handle_incident (Step 3 - Safe Actions & Policy Engine)
 */
import { handleIncident } from "@/lib/archestra/safe-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const trackingNumber = request.nextUrl.searchParams.get("tracking");
  const referenceDateParam = request.nextUrl.searchParams.get("referenceDate");

  if (!trackingNumber?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing tracking number. Use ?tracking=FX9876543210",
      },
      { status: 400 }
    );
  }

  const options =
    referenceDateParam && !Number.isNaN(Date.parse(referenceDateParam))
      ? { referenceDate: new Date(referenceDateParam) }
      : undefined;

  try {
    const result = handleIncident(trackingNumber, options);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 404 }
    );
  }
}
