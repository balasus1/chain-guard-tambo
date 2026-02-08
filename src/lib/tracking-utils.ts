/**
 * Utility functions for tracking data transformation
 */

import type { Shipment, TrackingEvent } from "./tracking-schemas";
import type { TimelineProps } from "@/components/tambo/timeline";

/**
 * Transform Shipment events to Timeline events format
 */
export function shipmentToTimelineEvents(
  shipment: Shipment,
): TimelineProps["events"] {
  return shipment.events.map((event: TrackingEvent) => ({
    timestamp: event.checkpoint_time || event.checkpoint_date || "",
    date: event.checkpoint_date || event.checkpoint_time || "",
    description: event.tracking_detail || "",
    location: event.location,
    city: event.city,
    country: event.country_name || event.country,
    status: inferStatusFromEvent(event),
  }));
}

/**
 * Infer status from tracking event description
 */
function inferStatusFromEvent(event: TrackingEvent): string | undefined {
  const detail = (event.tracking_detail || "").toLowerCase();
  
  if (detail.includes("delivered")) return "delivered";
  if (detail.includes("out for delivery")) return "out_for_delivery";
  if (detail.includes("in transit") || detail.includes("transit")) return "in_transit";
  if (detail.includes("exception") || detail.includes("delay")) return "exception";
  if (detail.includes("picked up") || detail.includes("pickup")) return "picked_up";
  if (detail.includes("arrived") || detail.includes("arrival")) return "arrived";
  if (detail.includes("departed") || detail.includes("departure")) return "departed";
  if (detail.includes("return")) return "returned";
  
  return undefined;
}

/**
 * Get courier display name from code
 */
export function getCourierDisplayName(code: string): string {
  const courierNames: Record<string, string> = {
    dhl: "DHL",
    ups: "UPS",
    fedex: "FedEx",
    usps: "USPS",
    tnt: "TNT",
    dpd: "DPD",
    aramex: "Aramex",
    china_post: "China Post",
    ems: "EMS",
    yanwen: "Yanwen",
    yunexpress: "YunExpress",
  };

  return courierNames[code.toLowerCase()] || code.toUpperCase();
}
