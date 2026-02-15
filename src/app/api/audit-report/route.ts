import { NextRequest, NextResponse } from "next/server";
import {
  buildAuditReportData,
  generateExcelReport,
  generatePdfReport,
} from "@/services/audit-report";

export async function GET(request: NextRequest) {
  const tracking = request.nextUrl.searchParams.get("tracking");
  const format = request.nextUrl.searchParams.get("format")?.toLowerCase();
  const referenceDateParam = request.nextUrl.searchParams.get("referenceDate");

  if (!tracking?.trim()) {
    return NextResponse.json(
      { success: false, error: "Missing tracking number. Use ?tracking=FX9876543210" },
      { status: 400 },
    );
  }

  const options =
    referenceDateParam && !Number.isNaN(Date.parse(referenceDateParam))
      ? { referenceDate: new Date(referenceDateParam) }
      : undefined;

  const reportData = buildAuditReportData(tracking, options);

  if (format === "pdf") {
    const pdfBuffer = await generatePdfReport(reportData);
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-report-${tracking}.pdf"`,
      },
    });
  }

  const excelBuffer = generateExcelReport(reportData);
  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="audit-report-${tracking}.xlsx"`,
    },
  });
}
