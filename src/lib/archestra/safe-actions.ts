/**
 * Safe Actions for Archestra
 *
 * Concrete actions (create_ticket, notify_customer, notify_vendor) that
 * execute only under policy. Mock implementations for demo.
 */

import { auditShipment } from "./audit-agent";
import { getAllShipments } from "@/services/mock-tracking-data";
import { detectAnomalies } from "@/services/mock-tracking-data";
import type {
  AuditResult,
  SafeActionType,
  PolicyCheckResult,
  ActionOutcome,
} from "./types";
import { evaluatePolicy, type PolicyContext } from "./policy-engine";
import { appendDecisionLog } from "./decision-log";

/** Mock: create a ticket/incident */
function mockCreateTicket(
  trackingNumber: string,
  courierCode: string,
  _auditResult: AuditResult
): { success: boolean; ticketId: string } {
  const ticketId = `TKT-${Date.now()}-${trackingNumber.slice(-6)}`;
  // In production: call ticketing API
  console.log(`[MOCK] create_ticket: ${ticketId} for ${trackingNumber} (${courierCode})`);
  return { success: true, ticketId };
}

/** Mock: notify customer */
function mockNotifyCustomer(
  trackingNumber: string,
  _auditResult: AuditResult
): { success: boolean } {
  // In production: send email/SMS
  console.log(`[MOCK] notify_customer: shipment ${trackingNumber}`);
  return { success: true };
}

/** Mock: notify vendor */
function mockNotifyVendor(
  trackingNumber: string,
  courierCode: string,
  _auditResult: AuditResult
): { success: boolean } {
  // In production: send to carrier API
  console.log(`[MOCK] notify_vendor: ${courierCode} for ${trackingNumber}`);
  return { success: true };
}

/**
 * Execute a single action if policy allows
 */
export function executeAction(
  action: SafeActionType,
  auditResult: AuditResult,
  options?: { vendorDelayCount?: number }
): ActionOutcome {
  const context: PolicyContext = {
    auditResult,
    vendorDelayCount: options?.vendorDelayCount,
  };

  const policyCheck = evaluatePolicy(action, context);

  const outcome: ActionOutcome = {
    action,
    requested: true,
    executed: policyCheck.allowed,
    denied: !policyCheck.allowed,
    denialReason: policyCheck.allowed ? undefined : policyCheck.reason,
    policyCheck,
    timestamp: new Date().toISOString(),
  };

  if (policyCheck.allowed) {
    switch (action) {
      case "create_ticket":
        mockCreateTicket(
          auditResult.trackingNumber,
          auditResult.courierCode,
          auditResult
        );
        break;
      case "notify_customer":
        mockNotifyCustomer(auditResult.trackingNumber, auditResult);
        break;
      case "notify_vendor":
        mockNotifyVendor(
          auditResult.trackingNumber,
          auditResult.courierCode,
          auditResult
        );
        break;
    }
  }

  return outcome;
}

/**
 * Handle incident: audit shipment, then for each suggested action,
 * check policy and execute if allowed. Log everything.
 */
export function handleIncident(
  trackingNumber: string,
  options?: { referenceDate?: Date }
): {
  auditResult: AuditResult;
  outcomes: ActionOutcome[];
  decisionLogId: string;
} {
  const auditResult = auditShipment(trackingNumber, options);

  const actionsToTry: SafeActionType[] = [
    ...new Set([
      ...auditResult.suggestedActions.filter((a): a is SafeActionType =>
        ["create_ticket", "notify_customer", "notify_vendor"].includes(a)
      ),
    ]),
  ];

  const outcomes: ActionOutcome[] = [];
  const policyRulesEvaluated: string[] = [];

  const vendorDelayCount = getVendorDelayCount(auditResult.courierCode);

  for (const action of actionsToTry) {
    const outcome = executeAction(action, auditResult, { vendorDelayCount });
    outcomes.push(outcome);
    if (!policyRulesEvaluated.includes(outcome.policyCheck.ruleEvaluated)) {
      policyRulesEvaluated.push(outcome.policyCheck.ruleEvaluated);
    }
  }

  const entry = appendDecisionLog({
    trackingNumber: auditResult.trackingNumber,
    courierCode: auditResult.courierCode,
    auditResult: {
      verdict: auditResult.verdict,
      slaStatus: auditResult.slaStatus,
      riskLevel: auditResult.riskLevel,
      anomalyScore: auditResult.anomalyScore,
      anomalyTypes: auditResult.anomalies.map((a) => a.type),
      delayHours: auditResult.delayHours,
    },
    requestedActions: actionsToTry,
    outcomes,
    policyRulesEvaluated,
  });

  return {
    auditResult,
    outcomes,
    decisionLogId: entry.id,
  };
}

function getVendorDelayCount(vendorId: string): number {
  const shipments = getAllShipments().filter(
    (s) => s.courier_code.toLowerCase() === vendorId.toLowerCase()
  );
  let count = 0;
  for (const s of shipments) {
    const { hasAnomaly, anomalies } = detectAnomalies(s);
    if (hasAnomaly && anomalies.some((a) => a.type === "delay")) {
      count += 1;
    }
  }
  return count;
}
