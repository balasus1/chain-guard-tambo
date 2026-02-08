"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import { z } from "zod";
import { Package, MapPin, Calendar, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react";

/**
 * Type for shipment card variant
 */
type ShipmentCardVariant = "default" | "compact" | "detailed";

/**
 * Variants for the ShipmentCard component
 */
export const shipmentCardVariants = cva(
  "w-full rounded-lg border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background border-border",
        compact: "bg-muted/30 border-border/50",
        detailed: "bg-background border-2 border-border shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Zod schema for ShipmentCard
 */
export const shipmentCardSchema = z.object({
  trackingNumber: z.string().describe("Tracking number"),
  courierCode: z.string().optional().describe("Courier code (e.g., 'dhl', 'ups')"),
  courierName: z.string().optional().describe("Display name of courier"),
  status: z.string().optional().describe("Current status"),
  lastEvent: z.string().optional().describe("Last tracking event description"),
  lastUpdateTime: z.string().optional().describe("Last update timestamp"),
  origin: z
    .object({
      country: z.string().optional(),
      city: z.string().optional(),
    })
    .optional()
    .describe("Origin location"),
  destination: z
    .object({
      country: z.string().optional(),
      city: z.string().optional(),
    })
    .optional()
    .describe("Destination location"),
  orderId: z.string().optional().describe("Associated order ID"),
  orderDate: z.string().optional().describe("Order date"),
  title: z.string().optional().describe("Shipment title/description"),
  variant: z
    .enum(["default", "compact", "detailed"])
    .optional()
    .describe("Visual style variant"),
  className: z.string().optional().describe("Additional CSS classes"),
  onClick: z
    .function()
    .optional()
    .describe("Optional click handler for navigation"),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type ShipmentCardProps = z.infer<typeof shipmentCardSchema>;

/**
 * Get status icon and color
 */
const getStatusInfo = (status?: string) => {
  if (!status) {
    return { icon: Clock, color: "text-gray-500", bgColor: "bg-gray-100" };
  }

  const statusLower = status.toLowerCase();
  if (statusLower.includes("delivered")) {
    return { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50" };
  }
  if (statusLower.includes("transit") || statusLower.includes("in_transit")) {
    return { icon: Truck, color: "text-blue-600", bgColor: "bg-blue-50" };
  }
  if (statusLower.includes("exception") || statusLower.includes("delay")) {
    return { icon: AlertCircle, color: "text-yellow-600", bgColor: "bg-yellow-50" };
  }
  return { icon: Clock, color: "text-gray-500", bgColor: "bg-gray-100" };
};

/**
 * Format courier name
 */
const formatCourierName = (code: string | undefined): string => {
  if (!code) return "Unknown Courier";
  return code
    .toUpperCase()
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Format date
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * ShipmentCard Component
 * 
 * Displays shipment information in a card format with status indicators.
 * 
 * @example
 * ```tsx
 * <ShipmentCard
 *   trackingNumber="1Z999AA10123456784"
 *   courierCode="ups"
 *   status="in_transit"
 *   lastEvent="Package in transit"
 *   origin={{ city: "New York", country: "US" }}
 *   destination={{ city: "Los Angeles", country: "US" }}
 *   variant="detailed"
 * />
 * ```
 */
export const ShipmentCard = React.forwardRef<HTMLDivElement, ShipmentCardProps>(
  (
    {
      className,
      variant,
      trackingNumber,
      courierCode,
      courierName,
      status,
      lastEvent,
      lastUpdateTime,
      origin,
      destination,
      orderId,
      orderDate,
      title,
      onClick,
      ...props
    },
    ref,
  ) => {
    const statusInfo = getStatusInfo(status);
    const StatusIcon = statusInfo.icon;
    const courierDisplayName = courierName || formatCourierName(courierCode || "");

    return (
      <div
        ref={ref}
        className={cn(
          shipmentCardVariants({ variant }),
          onClick && "cursor-pointer hover:shadow-md",
          className,
        )}
        onClick={onClick}
        {...props}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-foreground truncate">
                  {title || `Shipment ${trackingNumber}`}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {trackingNumber}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                statusInfo.bgColor,
                statusInfo.color,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize">
                {status ? status.replace(/_/g, " ") : "Unknown"}
              </span>
            </div>
          </div>

          {/* Courier Info */}
          {(courierCode || courierName) && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{courierDisplayName}</span>
            </div>
          )}

          {/* Route Info */}
          {(origin || destination) && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-foreground">
                  {origin?.city || origin?.country || "Unknown"}
                </span>
                <span className="text-muted-foreground mx-1">→</span>
                <span className="text-foreground">
                  {destination?.city || destination?.country || "Unknown"}
                </span>
              </div>
            </div>
          )}

          {/* Last Event */}
          {lastEvent && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Last Update</p>
              <p className="text-sm text-foreground">{lastEvent}</p>
              {lastUpdateTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(lastUpdateTime)}
                </p>
              )}
            </div>
          )}

          {/* Order Info */}
          {(orderId || orderDate) && variant === "detailed" && (
            <div className="flex items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
              {orderId && (
                <div className="flex items-center gap-1">
                  <span>Order:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
              )}
              {orderDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(orderDate)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ShipmentCard.displayName = "ShipmentCard";
