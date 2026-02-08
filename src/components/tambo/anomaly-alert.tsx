"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import { z } from "zod";
import { AlertTriangle, Clock, MapPin, Thermometer, FileX, AlertCircle } from "lucide-react";

/**
 * Type for anomaly severity
 */
type AnomalySeverity = "low" | "medium" | "high";

/**
 * Variants for the AnomalyAlert component
 */
export const anomalyAlertVariants = cva(
  "w-full rounded-lg border transition-all duration-200",
  {
    variants: {
      severity: {
        low: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
        medium: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
        high: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
      },
    },
    defaultVariants: {
      severity: "medium",
    },
  },
);

/**
 * Zod schema for Anomaly
 */
export const anomalySchema = z.object({
  type: z.string().describe("Type of anomaly"),
  severity: z.enum(["low", "medium", "high"]).describe("Severity level"),
  description: z.string().describe("Description of the anomaly"),
  timestamp: z.string().describe("When the anomaly occurred"),
});

/**
 * Zod schema for AnomalyAlert
 */
export const anomalyAlertSchema = z.object({
  anomalies: z
    .array(anomalySchema)
    .describe("Array of anomalies to display"),
  trackingNumber: z.string().optional().describe("Tracking number associated with anomalies"),
  className: z.string().optional().describe("Additional CSS classes"),
  onReportAnomaly: z
    .function()
    .optional()
    .describe("Callback when user wants to report an anomaly"),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type AnomalyAlertProps = z.infer<typeof anomalyAlertSchema>;

/**
 * Get icon and color for anomaly type
 */
const getAnomalyIcon = (type: string) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("delay")) {
    return { icon: Clock, color: "text-yellow-600 dark:text-yellow-400" };
  }
  if (typeLower.includes("route") || typeLower.includes("deviation")) {
    return { icon: MapPin, color: "text-orange-600 dark:text-orange-400" };
  }
  if (typeLower.includes("temperature") || typeLower.includes("cold")) {
    return { icon: Thermometer, color: "text-red-600 dark:text-red-400" };
  }
  if (typeLower.includes("customs")) {
    return { icon: FileX, color: "text-orange-600 dark:text-orange-400" };
  }
  return { icon: AlertCircle, color: "text-gray-600 dark:text-gray-400" };
};

/**
 * Format timestamp
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
};

/**
 * AnomalyAlert Component
 * 
 * Displays detected anomalies in a shipment with severity indicators and options to report issues.
 * 
 * @example
 * ```tsx
 * <AnomalyAlert
 *   anomalies={[
 *     {
 *       type: "delay",
 *       severity: "high",
 *       description: "No update for 72 hours",
 *       timestamp: "2024-01-15T10:00:00Z"
 *     }
 *   ]}
 *   trackingNumber="1Z999AA10123456784"
 *   onReportAnomaly={(anomaly) => console.log("Report:", anomaly)}
 * />
 * ```
 */
export const AnomalyAlert = React.forwardRef<HTMLDivElement, AnomalyAlertProps>(
  ({ className, anomalies = [], trackingNumber, onReportAnomaly, ...props }, ref) => {
    if (!anomalies || anomalies.length === 0) {
      return null;
    }

    // Sort by severity (high first)
    const sortedAnomalies = [...anomalies].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const highestSeverity = sortedAnomalies[0]?.severity || "medium";

    return (
      <div
        ref={ref}
        className={cn(anomalyAlertVariants({ severity: highestSeverity }), className)}
        {...props}
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle
              className={cn(
                "h-5 w-5 flex-shrink-0 mt-0.5",
                highestSeverity === "high"
                  ? "text-red-600 dark:text-red-400"
                  : highestSeverity === "medium"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-yellow-600 dark:text-yellow-400",
              )}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                {anomalies.length === 1
                  ? "Anomaly Detected"
                  : `${anomalies.length} Anomalies Detected`}
              </h3>
              {trackingNumber && (
                <p className="text-xs text-muted-foreground font-mono">
                  {trackingNumber}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {sortedAnomalies.map((anomaly, index) => {
              const { icon: Icon, color } = getAnomalyIcon(anomaly.type);
              const severityLabels = {
                high: "High Priority",
                medium: "Medium Priority",
                low: "Low Priority",
              };

              return (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-md border",
                    anomaly.severity === "high"
                      ? "bg-red-100/50 border-red-300 dark:bg-red-950/30 dark:border-red-800"
                      : anomaly.severity === "medium"
                        ? "bg-orange-100/50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800"
                        : "bg-yellow-100/50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800",
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {anomaly.type.replace(/_/g, " ")}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-medium",
                            anomaly.severity === "high"
                              ? "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : anomaly.severity === "medium"
                                ? "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                : "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                          )}
                        >
                          {severityLabels[anomaly.severity]}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">{anomaly.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(anomaly.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {onReportAnomaly && (
            <button
              onClick={() => onReportAnomaly(sortedAnomalies[0])}
              className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Report Issue / Log Ticket
            </button>
          )}
        </div>
      </div>
    );
  },
);

AnomalyAlert.displayName = "AnomalyAlert";
