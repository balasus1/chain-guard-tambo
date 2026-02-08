/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import { Timeline, timelineSchema } from "@/components/tambo/timeline";
import { ShipmentCard, shipmentCardSchema } from "@/components/tambo/shipment-card";
import { AnomalyAlert, anomalyAlertSchema } from "@/components/tambo/anomaly-alert";
import { TicketForm, ticketFormSchema } from "@/components/tambo/ticket-form";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import {
  createShipmentTracking,
  getShipmentTracking,
  searchShipments,
  detectShipmentAnomalies,
} from "@/services/tracking-tools";
import { shipmentSchema, createTrackingRequestSchema, getTrackingRequestSchema, searchShipmentsFilterSchema } from "@/lib/tracking-schemas";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description:
      "A tool to get population statistics by country with advanced filtering options",
    tool: getCountryPopulations,
    inputSchema: z.object({
      continent: z.string().optional(),
      sortBy: z.enum(["population", "growthRate"]).optional(),
      limit: z.number().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        continent: z.enum([
          "Asia",
          "Africa",
          "Europe",
          "North America",
          "South America",
          "Oceania",
        ]),
        population: z.number(),
        year: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  {
    name: "globalPopulation",
    description:
      "A tool to get global population trends with optional year range filtering",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  // Chain-Guard Tracking Tools
  {
    name: "createShipmentTracking",
    description:
      "Create a new shipment tracking in TrackingMore API. Use this to start tracking a package with a tracking number and courier code (e.g., 'dhl', 'ups', 'fedex', 'usps').",
    tool: createShipmentTracking,
    inputSchema: createTrackingRequestSchema,
    outputSchema: shipmentSchema,
  },
  {
    name: "getShipmentTracking",
    description:
      "Get detailed tracking information for a shipment including all events in the immutable timeline. Returns complete tracking history with locations and timestamps.",
    tool: getShipmentTracking,
    inputSchema: getTrackingRequestSchema,
    outputSchema: shipmentSchema,
  },
  {
    name: "searchShipments",
    description:
      "Search and list shipments with optional filters by courier, tracking number, date range, or pagination. Returns an array of shipments with their tracking information.",
    tool: searchShipments,
    inputSchema: searchShipmentsFilterSchema.extend({
      tracking_number: z.string().optional().describe("Search by tracking number (partial match)"),
    }),
    outputSchema: z.array(shipmentSchema),
  },
  {
    name: "detectShipmentAnomalies",
    description:
      "Detect anomalies in a shipment such as delays, route deviations, temperature issues, or customs delays. Returns detailed anomaly information with severity levels.",
    tool: detectShipmentAnomalies,
    inputSchema: z.object({
      tracking_number: z.string().min(1).describe("Tracking number to analyze"),
    }),
    outputSchema: z.object({
      hasAnomaly: z.boolean().describe("Whether any anomalies were detected"),
      anomalies: z.array(
        z.object({
          type: z.string().describe("Type of anomaly (delay, route_deviation, temperature, customs_delay)"),
          severity: z.enum(["low", "medium", "high"]).describe("Severity level"),
          description: z.string().describe("Description of the anomaly"),
          timestamp: z.string().describe("When the anomaly occurred"),
        }),
      ).describe("Array of detected anomalies"),
    }),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  // Chain-Guard Components
  {
    name: "Timeline",
    description:
      "Displays an immutable timeline of tracking events with timestamps, locations, and status indicators. Perfect for showing shipment history and audit trails. Events are displayed chronologically with visual indicators for different statuses (delivered, in_transit, exception, etc.).",
    component: Timeline,
    propsSchema: timelineSchema,
  },
  {
    name: "ShipmentCard",
    description:
      "Displays shipment information in a card format with tracking number, courier, status, route (origin to destination), and last update. Shows visual status indicators and can be clicked for navigation. Perfect for listing multiple shipments or showing shipment summary.",
    component: ShipmentCard,
    propsSchema: shipmentCardSchema,
  },
  {
    name: "AnomalyAlert",
    description:
      "Displays detected anomalies in a shipment such as delays, route deviations, temperature issues, or customs delays. Shows severity levels (low, medium, high) with color-coded alerts and provides option to report issues. Use this when anomalies are detected in tracking data.",
    component: AnomalyAlert,
    propsSchema: anomalyAlertSchema,
  },
  {
    name: "TicketForm",
    description:
      "Form component for logging tickets or sending emails about shipment issues. Allows users to report problems with tracking, delays, or anomalies. Includes fields for email, subject, priority, and detailed message. Perfect for customer support integration.",
    component: TicketForm,
    propsSchema: ticketFormSchema,
  },
];
