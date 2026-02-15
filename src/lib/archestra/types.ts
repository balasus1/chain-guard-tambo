/**
 * Archestra AI Types for Chain-Guard
 *
 * Type definitions for the Logistics Audit Agent, policy engine,
 * and safe actions.
 */

/** SLA status of a shipment relative to expected delivery */
export type SlaStatus = "on_track" | "warning" | "failed";

/** Overall risk level of a shipment */
export type RiskLevel = "low" | "medium" | "high";

/** Audit verdict summarizing shipment health */
export type Verdict = "OK" | "Warning" | "Failed";

/** Anomaly types detected by the audit agent */
export type AnomalyType =
  | "delay"
  | "route_deviation"
  | "temperature"
  | "customs_delay";

/** Severity of a detected anomaly */
export type AnomalySeverity = "low" | "medium" | "high";

/** Suggested next actions for operators */
export type SuggestedAction =
  | "notify_customer"
  | "notify_vendor"
  | "create_ticket"
  | "monitor";

/** A single detected anomaly */
export interface DetectedAnomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  timestamp: string;
}

/** Result of auditing a shipment */
export interface AuditResult {
  trackingNumber: string;
  courierCode: string;
  verdict: Verdict;
  slaStatus: SlaStatus;
  riskLevel: RiskLevel;
  anomalyScore: number;
  anomalies: DetectedAnomaly[];
  explanation: string;
  suggestedActions: SuggestedAction[];
  slaConfigUsed: string;
  /** Hours since last tracking update (for in-transit shipments) */
  delayHours?: number;
}

/** Action types that can be requested/executed */
export type SafeActionType = "create_ticket" | "notify_customer" | "notify_vendor";

/** Result of a policy check */
export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  ruleEvaluated: string;
}

/** Outcome of attempting an action */
export interface ActionOutcome {
  action: SafeActionType;
  requested: boolean;
  executed: boolean;
  denied: boolean;
  denialReason?: string;
  policyCheck: PolicyCheckResult;
  timestamp: string;
}

/** Full decision log entry for an invocation */
export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  trackingNumber: string;
  courierCode: string;
  auditResult: {
    verdict: Verdict;
    slaStatus: SlaStatus;
    riskLevel: RiskLevel;
    anomalyScore: number;
    anomalyTypes: AnomalyType[];
    delayHours?: number;
  };
  requestedActions: SafeActionType[];
  outcomes: ActionOutcome[];
  policyRulesEvaluated: string[];
}

/** SLA configuration (loaded from JSON) */
export interface SlaConfig {
  version: string;
  description?: string;
  globalDefaults: {
    maxTransitDaysDomestic: number;
    maxTransitDaysInternational: number;
    warningDelayHours: number;
    breachDelayHours: number;
    customerVisibleDelayHours: number;
  };
  vendorOverrides: Record<
    string,
    {
      maxTransitDaysDomestic?: number;
      maxTransitDaysInternational?: number;
    }
  >;
  routeRules: Array<{
    origin: string;
    destination: string;
    maxTransitDays: number;
    label?: string;
  }>;
  allowedDelaysBySeverity: Record<AnomalySeverity, number>;
  temperatureSensitiveRules: {
    maxTransitDays: number;
    strictTemperatureBreach: boolean;
    autoFailOnBreach: boolean;
  };
}
