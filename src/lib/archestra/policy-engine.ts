/**
 * Policy Engine for Archestra
 *
 * Deterministic policies that gate safe actions. Agents cannot execute
 * actions without passing policy checks.
 */

import { loadSlaConfig, getDelayThresholds } from "./sla-config";
import { getAllShipments } from "@/services/mock-tracking-data";
import { detectAnomalies } from "@/services/mock-tracking-data";
import type {
  AuditResult,
  SafeActionType,
  PolicyCheckResult,
  AnomalyType,
} from "./types";

/** Context passed to policy evaluation */
export interface PolicyContext {
  auditResult: AuditResult;
  /** Number of delayed shipments from this vendor in recent data (for repeated delays) */
  vendorDelayCount?: number;
}

/**
 * Count how many shipments from the given vendor have delay anomalies
 */
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

/**
 * Policy: create_ticket
 * Allowed when: risk_level = high, OR (SLA breach > 48h AND anomaly type is delay or temperature)
 */
function evaluateCreateTicket(ctx: PolicyContext): PolicyCheckResult {
  const { auditResult } = ctx;
  const config = loadSlaConfig();
  const { breachHours } = getDelayThresholds(config);

  const delayHours = auditResult.delayHours ?? 0;
  const hasDelayOrTemp = auditResult.anomalies.some(
    (a) => a.type === "delay" || a.type === "temperature"
  );
  const slaBreach = delayHours >= breachHours;

  if (auditResult.riskLevel === "high") {
    return {
      allowed: true,
      reason: "Risk level is high",
      ruleEvaluated: "create_ticket: risk_level=high",
    };
  }

  if (slaBreach && hasDelayOrTemp) {
    return {
      allowed: true,
      reason: `SLA breach (${Math.round(delayHours)}h >= ${breachHours}h) and delay/temperature anomaly`,
      ruleEvaluated: "create_ticket: sla_breach_and_delay_or_temperature",
    };
  }

  return {
    allowed: false,
    reason: "Ticket creation requires risk_level=high OR (SLA breach > 48h AND delay/temperature anomaly). Agent may recommend but cannot execute.",
    ruleEvaluated: "create_ticket: policy_not_met",
  };
}

/**
 * Policy: notify_customer
 * Allowed when: SLA breached beyond customer-visible threshold (> 24h delay).
 * Not allowed for low-risk anomalies only (e.g. minor route deviation with no delay).
 */
function evaluateNotifyCustomer(ctx: PolicyContext): PolicyCheckResult {
  const { auditResult } = ctx;
  const config = loadSlaConfig();
  const { customerVisibleHours } = getDelayThresholds(config);

  const delayHours = auditResult.delayHours ?? 0;
  const hasDelay = auditResult.anomalies.some((a) => a.type === "delay");
  const customerVisibleBreach = delayHours >= customerVisibleHours;

  if (!hasDelay && auditResult.riskLevel === "low") {
    return {
      allowed: false,
      reason: "Low-risk anomaly (e.g. route deviation) with no delay. No customer notification needed.",
      ruleEvaluated: "notify_customer: low_risk_no_delay",
    };
  }

  if (customerVisibleBreach) {
    return {
      allowed: true,
      reason: `SLA breach exceeds customer-visible threshold (${Math.round(delayHours)}h >= ${customerVisibleHours}h)`,
      ruleEvaluated: "notify_customer: customer_visible_breach",
    };
  }

  if (hasDelay && (auditResult.riskLevel === "medium" || auditResult.riskLevel === "high")) {
    return {
      allowed: true,
      reason: "Delay anomaly with medium/high risk",
      ruleEvaluated: "notify_customer: delay_with_risk",
    };
  }

  return {
    allowed: false,
    reason:
      "Customer notification requires delay beyond customer-visible threshold or delay with medium+ risk",
    ruleEvaluated: "notify_customer: policy_not_met",
  };
}

/**
 * Policy: notify_vendor
 * Allowed for: route_deviation, temperature issues, repeated delays from same vendor
 */
function evaluateNotifyVendor(ctx: PolicyContext): PolicyCheckResult {
  const { auditResult } = ctx;
  const hasRoute = auditResult.anomalies.some((a) => a.type === "route_deviation");
  const hasTemp = auditResult.anomalies.some((a) => a.type === "temperature");
  const hasCustoms = auditResult.anomalies.some((a) => a.type === "customs_delay");
  const hasDelay = auditResult.anomalies.some((a) => a.type === "delay");

  const vendorDelayCount = ctx.vendorDelayCount ?? getVendorDelayCount(auditResult.courierCode);
  const repeatedDelays = vendorDelayCount >= 2;

  if (hasRoute) {
    return {
      allowed: true,
      reason: "Route deviation detected",
      ruleEvaluated: "notify_vendor: route_deviation",
    };
  }

  if (hasTemp) {
    return {
      allowed: true,
      reason: "Temperature/cold chain issue",
      ruleEvaluated: "notify_vendor: temperature",
    };
  }

  if (hasCustoms) {
    return {
      allowed: true,
      reason: "Customs delay",
      ruleEvaluated: "notify_vendor: customs_delay",
    };
  }

  if (hasDelay && repeatedDelays) {
    return {
      allowed: true,
      reason: `Repeated delays from vendor (${vendorDelayCount} shipments with delay)`,
      ruleEvaluated: "notify_vendor: repeated_delays",
    };
  }

  if (hasDelay) {
    return {
      allowed: true,
      reason: "Delay anomaly - vendor should be notified",
      ruleEvaluated: "notify_vendor: delay",
    };
  }

  return {
    allowed: false,
    reason: "Vendor notification allowed for route_deviation, temperature, customs_delay, or delays",
    ruleEvaluated: "notify_vendor: policy_not_met",
  };
}

/**
 * Evaluate policy for an action
 */
export function evaluatePolicy(
  action: SafeActionType,
  context: PolicyContext
): PolicyCheckResult {
  switch (action) {
    case "create_ticket":
      return evaluateCreateTicket(context);
    case "notify_customer":
      return evaluateNotifyCustomer(context);
    case "notify_vendor":
      return evaluateNotifyVendor(context);
    default: {
      const _: never = action;
      return {
        allowed: false,
        reason: `Unknown action: ${action}`,
        ruleEvaluated: "unknown",
      };
    }
  }
}
