"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import { z } from "zod";
import { MapPin, Clock, Package } from "lucide-react";

/**
 * Type for timeline variant
 */
type TimelineVariant = "default" | "compact" | "detailed";

/**
 * Type for timeline size
 */
type TimelineSize = "default" | "sm" | "lg";

/**
 * Variants for the Timeline component
 */
export const timelineVariants = cva(
  "w-full rounded-lg overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background",
        compact: "bg-muted/50",
        detailed: "bg-background border border-border",
      },
      size: {
        default: "min-h-64",
        sm: "min-h-48",
        lg: "min-h-96",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Zod schema for Timeline Event
 */
export const timelineEventSchema = z.object({
  timestamp: z.string().describe("Event timestamp (ISO format)"),
  date: z.string().describe("Event date"),
  description: z.string().describe("Event description"),
  location: z.string().optional().describe("Location name"),
  city: z.string().optional().describe("City name"),
  country: z.string().optional().describe("Country name"),
  status: z.string().optional().describe("Status (e.g., 'in_transit', 'delivered')"),
});

/**
 * Zod schema for Timeline
 */
export const timelineSchema = z.object({
  title: z.string().optional().describe("Title for the timeline"),
  events: z
    .array(timelineEventSchema)
    .describe("Array of tracking events in chronological order"),
  variant: z
    .enum(["default", "compact", "detailed"])
    .optional()
    .describe("Visual style variant"),
  size: z
    .enum(["default", "sm", "lg"])
    .optional()
    .describe("Size of the timeline"),
  className: z.string().optional().describe("Additional CSS classes"),
  showTimestamps: z
    .boolean()
    .optional()
    .describe("Whether to show timestamps (default: true)"),
  showLocations: z
    .boolean()
    .optional()
    .describe("Whether to show location info (default: true)"),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type TimelineProps = z.infer<typeof timelineSchema>;

/**
 * Get status color based on status string
 */
const getStatusColor = (status?: string): string => {
  if (!status) return "bg-gray-500";
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes("delivered")) return "bg-green-500";
  if (statusLower.includes("transit") || statusLower.includes("in_transit")) return "bg-blue-500";
  if (statusLower.includes("exception") || statusLower.includes("delay")) return "bg-yellow-500";
  if (statusLower.includes("failed") || statusLower.includes("return")) return "bg-red-500";
  return "bg-gray-500";
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string, date: string): string => {
  try {
    const dateObj = new Date(timestamp || date);
    return dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date || timestamp;
  }
};

/**
 * Timeline Component
 * 
 * Displays an immutable timeline of tracking events with location and timestamp information.
 * Perfect for auditing and chain-of-custody verification.
 * 
 * @example
 * ```tsx
 * <Timeline
 *   title="Shipment ABC123 Timeline"
 *   events={[
 *     {
 *       timestamp: "2024-01-15T10:00:00Z",
 *       date: "2024-01-15",
 *       description: "Package picked up",
 *       location: "New York Distribution Center",
 *       city: "New York",
 *       country: "United States",
 *       status: "in_transit"
 *     }
 *   ]}
 *   variant="detailed"
 *   size="lg"
 * />
 * ```
 */
export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  (
    {
      className,
      variant,
      size,
      title,
      events = [],
      showTimestamps = true,
      showLocations = true,
      ...props
    },
    ref,
  ) => {
    if (!events || events.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(timelineVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-muted-foreground text-center">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tracking events available</p>
            </div>
          </div>
        </div>
      );
    }

    // Sort events by timestamp (most recent first)
    const sortedEvents = [...events].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.date).getTime();
      const timeB = new Date(b.timestamp || b.date).getTime();
      return timeB - timeA; // Descending order
    });

    return (
      <div
        ref={ref}
        className={cn(timelineVariants({ variant, size }), className)}
        {...props}
      >
        <div className="p-4 h-full">
          {title && (
            <h3 className="text-lg font-medium mb-4 text-foreground">{title}</h3>
          )}

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {sortedEvents.map((event, index) => {
                const statusColor = getStatusColor(event.status);
                const formattedTime = formatTimestamp(event.timestamp, event.date);

                return (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full border-2 border-background flex items-center justify-center",
                          statusColor,
                        )}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="bg-muted/50 rounded-lg p-3 border border-border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-foreground flex-1">
                            {event.description}
                          </p>
                          {showTimestamps && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{formattedTime}</span>
                            </div>
                          )}
                        </div>

                        {showLocations && (event.location || event.city || event.country) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {[
                                event.location,
                                event.city,
                                event.country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}

                        {event.status && (
                          <div className="mt-2">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                statusColor,
                                "text-white",
                              )}
                            >
                              {event.status.replace(/_/g, " ").replace(/\b\w/g, (l) =>
                                l.toUpperCase(),
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Timeline.displayName = "Timeline";
