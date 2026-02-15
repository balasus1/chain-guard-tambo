/**
 * Archestra tools exposed to Tambo
 *
 * Wraps the audit agent and playbooks for AI invocation.
 */
import { auditShipment } from "@/lib/archestra/audit-agent";
import { handleIncident } from "@/lib/archestra/safe-actions";

/**
 * Audit a shipment - Logistics Audit Agent (Archestra hero agent)
 */
export async function auditShipmentTool(params: {
  tracking_number: string;
}): Promise<{
  trackingNumber: string;
  courierCode: string;
  verdict: string;
  slaStatus: string;
  riskLevel: string;
  anomalyScore: number;
  anomalies: Array<{
    type: string;
    severity: string;
    description: string;
    timestamp: string;
  }>;
  explanation: string;
  suggestedActions: string[];
}> {
  const result = auditShipment(params.tracking_number);
  return {
    trackingNumber: result.trackingNumber,
    courierCode: result.courierCode,
    verdict: result.verdict,
    slaStatus: result.slaStatus,
    riskLevel: result.riskLevel,
    anomalyScore: result.anomalyScore,
    anomalies: result.anomalies,
    explanation: result.explanation,
    suggestedActions: result.suggestedActions,
  };
}

/**
 * Handle incident end-to-end - audit + execute policy-gated actions
 */
export async function handleIncidentTool(params: {
  tracking_number: string;
  reference_date?: string;
}): Promise<{
  auditResult: {
    trackingNumber: string;
    courierCode: string;
    verdict: string;
    slaStatus: string;
    riskLevel: string;
    anomalyScore: number;
    anomalies: Array<{ type: string; severity: string; description: string; timestamp: string }>;
    explanation: string;
    suggestedActions: string[];
  };
  outcomes: Array<{
    action: string;
    executed: boolean;
    denied: boolean;
    denialReason?: string;
    policyCheck: { allowed: boolean; reason: string; ruleEvaluated: string };
  }>;
  decisionLogId: string;
}> {
  const options =
    params.reference_date && !Number.isNaN(Date.parse(params.reference_date))
      ? { referenceDate: new Date(params.reference_date) }
      : undefined;

  const result = handleIncident(params.tracking_number, options);
  return {
    auditResult: {
      trackingNumber: result.auditResult.trackingNumber,
      courierCode: result.auditResult.courierCode,
      verdict: result.auditResult.verdict,
      slaStatus: result.auditResult.slaStatus,
      riskLevel: result.auditResult.riskLevel,
      anomalyScore: result.auditResult.anomalyScore,
      anomalies: result.auditResult.anomalies,
      explanation: result.auditResult.explanation,
      suggestedActions: result.auditResult.suggestedActions,
    },
    outcomes: result.outcomes.map((o) => ({
      action: o.action,
      executed: o.executed,
      denied: o.denied,
      denialReason: o.denialReason,
      policyCheck: o.policyCheck,
    })),
    decisionLogId: result.decisionLogId,
  };
}

/**
 * Generate audit report download links (PDF + Excel)
 */
export async function generateAuditReportTool(params: {
  tracking_number: string;
}): Promise<{
  trackingNumber: string;
  pdfUrl: string;
  excelUrl: string;
}> {
  const tracking = params.tracking_number;
  return {
    trackingNumber: tracking,
    pdfUrl: `/api/audit-report?tracking=${encodeURIComponent(tracking)}&format=pdf`,
    excelUrl: `/api/audit-report?tracking=${encodeURIComponent(tracking)}&format=xlsx`,
  };
}
