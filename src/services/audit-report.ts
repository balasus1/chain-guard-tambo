import { auditShipment } from "@/lib/archestra/audit-agent";
import { getShipmentByTrackingNumber } from "@/services/mock-tracking-data";
import type { Shipment } from "@/lib/tracking-schemas";
import type { AuditResult } from "@/lib/archestra/types";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";

export type AuditReportData = {
  shipment: Shipment;
  audit: AuditResult;
  generatedAt: string;
};

export type AuditReportFormat = "pdf" | "xlsx";

export function buildAuditReportData(
  trackingNumber: string,
  options?: { referenceDate?: Date },
): AuditReportData {
  const shipment = getShipmentByTrackingNumber(trackingNumber.trim());
  if (!shipment) {
    throw new Error(
      `Shipment not found: ${trackingNumber}. Try: FX9876543210, 1234567890, 1Z999AA10123456784, 9405511899223197428490, TNT123456789`,
    );
  }

  const audit = auditShipment(trackingNumber, options);
  return {
    shipment,
    audit,
    generatedAt: new Date().toISOString(),
  };
}

export async function generatePdfReport(data: AuditReportData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const margin = 48;
  let y = height - margin;

  const addLine = (text: string, size = 12, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(text, {
      x: margin,
      y,
      size,
      font,
      color,
    });
    y -= size + 6;
  };

  addLine("Chain-Guard Audit Report", 18, rgb(0.2, 0.2, 0.4));
  addLine(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 10);
  y -= 6;

  addLine(`Tracking Number: ${data.shipment.tracking_number}`, 12);
  addLine(`Courier: ${data.shipment.courier_code}`, 12);
  addLine(`Verdict: ${data.audit.verdict}`, 12);
  addLine(`SLA Status: ${data.audit.slaStatus}`, 12);
  addLine(`Risk Level: ${data.audit.riskLevel}`, 12);
  addLine(`Anomaly Score: ${data.audit.anomalyScore}`, 12);
  if (data.audit.delayHours != null) {
    addLine(`Delay Hours: ${Math.round(data.audit.delayHours)}`, 12);
  }
  y -= 8;

  addLine("Detected Anomalies", 14, rgb(0.2, 0.2, 0.4));
  if (data.audit.anomalies.length === 0) {
    addLine("None", 11);
  } else {
    data.audit.anomalies.forEach((a) => {
      addLine(
        `- ${a.type} (${a.severity}): ${a.description} @ ${a.timestamp}`,
        10,
      );
    });
  }
  y -= 8;

  addLine("Suggested Actions", 14, rgb(0.2, 0.2, 0.4));
  if (data.audit.suggestedActions.length === 0) {
    addLine("None", 11);
  } else {
    data.audit.suggestedActions.forEach((a) => addLine(`- ${a}`, 10));
  }

  y -= 10;
  addLine("Shipment Timeline (Last 5 Events)", 14, rgb(0.2, 0.2, 0.4));
  const lastEvents = data.shipment.events.slice(-5);
  if (lastEvents.length === 0) {
    addLine("No events available", 11);
  } else {
    lastEvents.forEach((e) => {
      addLine(
        `- ${e.checkpoint_time || e.checkpoint_date}: ${e.tracking_detail}`,
        10,
      );
    });
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

export function generateExcelReport(data: AuditReportData): Buffer {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["Tracking Number", data.shipment.tracking_number],
    ["Courier", data.shipment.courier_code],
    ["Verdict", data.audit.verdict],
    ["SLA Status", data.audit.slaStatus],
    ["Risk Level", data.audit.riskLevel],
    ["Anomaly Score", data.audit.anomalyScore],
    ["Delay Hours", data.audit.delayHours ?? ""],
    ["Generated At", data.generatedAt],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  const anomaliesRows = [
    ["Type", "Severity", "Description", "Timestamp"],
    ...data.audit.anomalies.map((a) => [
      a.type,
      a.severity,
      a.description,
      a.timestamp,
    ]),
  ];
  const anomaliesSheet = XLSX.utils.aoa_to_sheet(anomaliesRows);
  XLSX.utils.book_append_sheet(wb, anomaliesSheet, "Anomalies");

  const eventsRows = [
    ["Time", "Description", "Location", "City", "Country"],
    ...data.shipment.events.map((e) => [
      e.checkpoint_time || e.checkpoint_date,
      e.tracking_detail,
      e.location ?? "",
      e.city ?? "",
      e.country_name ?? e.country ?? "",
    ]),
  ];
  const eventsSheet = XLSX.utils.aoa_to_sheet(eventsRows);
  XLSX.utils.book_append_sheet(wb, eventsSheet, "Timeline");

  const suggestedRows = [
    ["Suggested Actions"],
    ...data.audit.suggestedActions.map((a) => [a]),
  ];
  const suggestedSheet = XLSX.utils.aoa_to_sheet(suggestedRows);
  XLSX.utils.book_append_sheet(wb, suggestedSheet, "Actions");

  const output = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(output);
}
