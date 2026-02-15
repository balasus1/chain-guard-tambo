/**
 * Logistics Audit Agent for Chain-Guard (Archestra)
 *
 * Answers: "Is this shipment OK? If not, what's wrong, how risky is it,
 * and what should we do?"
 */

import { getShipmentByTrackingNumber } from "@/services/mock-tracking-data";
import type { Shipment } from "@/lib/tracking-schemas";
import {
  loadSlaConfig,
  getMaxTransitDays,
  getDelayThresholds,
} from "./sla-config";
import type {
  AuditResult,
  SlaStatus,
  RiskLevel,
  Verdict,
  DetectedAnomaly,
  SuggestedAction,
  AnomalyType,
  AnomalySeverity,
} from "./types";

/** Optional params for audit (e.g. reference date for reproducible demos) */
export interface AuditOptions {
  referenceDate?: Date;
}

/**
 * Compute anomaly score (0-100) from detected anomalies
 */
function computeAnomalyScore(anomalies: DetectedAnomaly[]): number {
  if (anomalies.length === 0) return 0;

  const severityWeights: Record<AnomalySeverity, number> = {
    low: 20,
    medium: 50,
    high: 80,
  };

  const typeWeights: Record<AnomalyType, number> = {
    delay: 1,
    route_deviation: 1.2,
    customs_delay: 1.1,
    temperature: 1.5,
  };

  let score = 0;
  for (const a of anomalies) {
    const base = severityWeights[a.severity];
    const mult = typeWeights[a.type as AnomalyType] ?? 1;
    score += base * mult;
  }

  return Math.min(100, Math.round(score / anomalies.length));
}

/**
 * Determine risk level from anomalies and anomaly score
 */
function computeRiskLevel(
  anomalies: DetectedAnomaly[],
  anomalyScore: number
): RiskLevel {
  if (anomalies.length === 0) return "low";

  const hasHigh = anomalies.some((a) => a.severity === "high");
  const hasTemperature = anomalies.some((a) => a.type === "temperature");

  if (hasTemperature || hasHigh || anomalyScore >= 70) return "high";
  if (anomalies.length >= 2 || anomalyScore >= 40) return "medium";
  return "low";
}

/**
 * Compute SLA status based on transit time, max days, and delay
 */
function computeSlaStatus(
  shipment: Shipment,
  maxTransitDays: number,
  delayHours: number,
  breachHours: number,
  warningHours: number
): SlaStatus {
  if (shipment.lastStatus === "delivered") {
    const firstEvent = shipment.events[0];
    const lastEvent = shipment.events[shipment.events.length - 1];
    if (!firstEvent || !lastEvent) return "on_track";

    const first = new Date(firstEvent.checkpoint_time || firstEvent.checkpoint_date);
    const last = new Date(lastEvent.checkpoint_time || lastEvent.checkpoint_date);
    const transitDays = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24);

    if (transitDays <= maxTransitDays) return "on_track";
    if (transitDays <= maxTransitDays * 1.25) return "warning";
    return "failed";
  }

  if (delayHours >= breachHours) return "failed";
  if (delayHours >= warningHours) return "warning";
  return "on_track";
}

/**
 * Detect anomalies using SLA-aware logic
 */
function detectAnomaliesWithSla(
  shipment: Shipment,
  referenceDate: Date,
  breachHours: number,
  warningHours: number
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  // Delay (no update for X hours, not delivered)
  if (shipment.events.length > 0 && shipment.lastStatus !== "delivered") {
    const lastEvent = shipment.events[shipment.events.length - 1];
    const lastTime = new Date(
      lastEvent.checkpoint_time || lastEvent.checkpoint_date
    );
    const delayHours =
      (referenceDate.getTime() - lastTime.getTime()) / (1000 * 60 * 60);

    if (delayHours > warningHours) {
      const severity: AnomalySeverity =
        delayHours >= breachHours ? "high" : "medium";
      anomalies.push({
        type: "delay",
        severity,
        description: `No tracking update for ${Math.round(delayHours)} hours`,
        timestamp: lastEvent.checkpoint_time || lastEvent.checkpoint_date,
      });
    }
  }

  // Route deviation
  const routeEvents = shipment.events.filter(
    (e) =>
      e.tracking_detail.toLowerCase().includes("deviation") ||
      e.tracking_detail.toLowerCase().includes("rerouted")
  );
  if (routeEvents.length > 0) {
    anomalies.push({
      type: "route_deviation",
      severity: "medium",
      description: "Unexpected route deviation detected",
      timestamp:
        routeEvents[0].checkpoint_time || routeEvents[0].checkpoint_date,
    });
  }

  // Temperature
  const tempEvents = shipment.events.filter(
    (e) =>
      e.tracking_detail.toLowerCase().includes("temperature") ||
      e.tracking_detail.toLowerCase().includes("cold chain")
  );
  if (tempEvents.length > 0) {
    anomalies.push({
      type: "temperature",
      severity: "high",
      description: "Temperature/cold chain breach detected",
      timestamp:
        tempEvents[0].checkpoint_time || tempEvents[0].checkpoint_date,
    });
  }

  // Customs delay
  const customsEvents = shipment.events.filter((e) =>
    e.tracking_detail.toLowerCase().includes("customs")
  );
  const customsDelay = customsEvents.find((e) =>
    e.tracking_detail.toLowerCase().includes("delay")
  );
  if (customsDelay) {
    anomalies.push({
      type: "customs_delay",
      severity: "medium",
      description: "Customs clearance delay",
      timestamp:
        customsDelay.checkpoint_time || customsDelay.checkpoint_date,
    });
  }

  return anomalies;
}

/**
 * Generate suggested actions from verdict, risk, and anomalies
 */
function suggestActions(
  verdict: Verdict,
  riskLevel: RiskLevel,
  anomalies: DetectedAnomaly[]
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  if (verdict === "OK" && anomalies.length === 0) {
    return ["monitor"];
  }

  const hasDelay = anomalies.some((a) => a.type === "delay");
  const hasRoute = anomalies.some((a) => a.type === "route_deviation");
  const hasTemp = anomalies.some((a) => a.type === "temperature");
  const hasCustoms = anomalies.some((a) => a.type === "customs_delay");

  if (riskLevel === "high" || hasTemp) {
    actions.push("create_ticket");
  }
  if (hasDelay && (riskLevel === "medium" || riskLevel === "high")) {
    actions.push("notify_customer");
  }
  if (hasRoute || hasTemp || hasCustoms) {
    actions.push("notify_vendor");
  }
  if (actions.length === 0) {
    actions.push("monitor");
  }

  return [...new Set(actions)];
}

/**
 * Build human-readable explanation
 */
function buildExplanation(
  verdict: Verdict,
  slaStatus: SlaStatus,
  riskLevel: RiskLevel,
  anomalies: DetectedAnomaly[]
): string {
  const parts: string[] = [];

  parts.push(
    `Verdict: ${verdict}. SLA status is ${slaStatus.replace("_", " ")}, risk level is ${riskLevel}.`
  );

  if (anomalies.length === 0) {
    parts.push("No anomalies detected. Shipment appears to be on track.");
  } else {
    parts.push(
      `Detected ${anomalies.length} anomaly(ies): ${anomalies
        .map((a) => `${a.type} (${a.severity})`)
        .join(", ")}.`
    );
  }

  return parts.join(" ");
}

/**
 * Audit a shipment - the core "hero agent" logic
 */
export function auditShipment(
  trackingNumber: string,
  options: AuditOptions = {}
): AuditResult {
  const shipment = getShipmentByTrackingNumber(trackingNumber.trim());

  if (!shipment) {
    throw new Error(
      `Shipment not found: ${trackingNumber}. Try: FX9876543210, 1234567890, 1Z999AA10123456784, 9405511899223197428490, TNT123456789`
    );
  }

  const referenceDate = options.referenceDate ?? new Date();
  const config = loadSlaConfig();
  const { warningHours, breachHours } = getDelayThresholds(config);

  const isTemperatureSensitive =
    shipment.title?.toLowerCase().includes("temperature") ||
    shipment.events.some(
      (e) =>
        e.tracking_detail.toLowerCase().includes("temperature") ||
        e.tracking_detail.toLowerCase().includes("cold chain")
    );

  const maxTransitDays = getMaxTransitDays(
    config,
    shipment.courier_code,
    shipment.origin_country,
    shipment.destination_country,
    isTemperatureSensitive
  );

  const anomalies = detectAnomaliesWithSla(
    shipment,
    referenceDate,
    breachHours,
    warningHours
  );

  // Compute delay hours for SLA (for in-transit)
  let delayHours = 0;
  if (shipment.events.length > 0 && shipment.lastStatus !== "delivered") {
    const lastEvent = shipment.events[shipment.events.length - 1];
    const lastTime = new Date(
      lastEvent.checkpoint_time || lastEvent.checkpoint_date
    );
    delayHours =
      (referenceDate.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
  }

  const slaStatus = computeSlaStatus(
    shipment,
    maxTransitDays,
    delayHours,
    breachHours,
    warningHours
  );

  const anomalyScore = computeAnomalyScore(anomalies);
  const riskLevel = computeRiskLevel(anomalies, anomalyScore);

  let verdict: Verdict = "OK";
  if (slaStatus === "failed" || riskLevel === "high" || anomalyScore >= 70) {
    verdict = "Failed";
  } else if (
    slaStatus === "warning" ||
    riskLevel === "medium" ||
    anomalies.length > 0
  ) {
    verdict = "Warning";
  }

  const suggestedActions = suggestActions(verdict, riskLevel, anomalies);
  const explanation = buildExplanation(
    verdict,
    slaStatus,
    riskLevel,
    anomalies
  );

  return {
    trackingNumber: shipment.tracking_number,
    courierCode: shipment.courier_code,
    verdict,
    slaStatus,
    riskLevel,
    anomalyScore,
    anomalies,
    explanation,
    suggestedActions,
    slaConfigUsed: `v${config.version}`,
    delayHours: shipment.lastStatus !== "delivered" ? delayHours : undefined,
  };
}
