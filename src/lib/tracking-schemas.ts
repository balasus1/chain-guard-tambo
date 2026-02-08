/**
 * Zod Schemas for Chain-Guard Tracking Data
 * 
 * These schemas define the data structures for tracking information
 * and are used for validation and type inference.
 */

import { z } from "zod";

/**
 * Tracking Event Schema
 * Represents a single event in the tracking timeline
 */
export const trackingEventSchema = z.object({
  checkpoint_time: z.string().describe("Timestamp of the checkpoint"),
  checkpoint_date: z.string().describe("Date of the checkpoint"),
  tracking_detail: z.string().describe("Description of the tracking event"),
  location: z.string().optional().describe("Location name"),
  country: z.string().optional().describe("Country code"),
  country_name: z.string().optional().describe("Full country name"),
  state: z.string().optional().describe("State or province"),
  city: z.string().optional().describe("City name"),
  zip: z.string().optional().describe("Postal/ZIP code"),
  coordinates: z
    .object({
      lat: z.number().describe("Latitude"),
      lng: z.number().describe("Longitude"),
    })
    .optional()
    .describe("Geographic coordinates"),
});

/**
 * Shipment Schema
 * Represents a complete shipment with tracking information
 */
export const shipmentSchema = z.object({
  id: z.string().describe("Unique shipment identifier"),
  tracking_number: z.string().describe("Tracking number"),
  courier_code: z.string().describe("Courier/carrier code (e.g., 'dhl', 'ups', 'fedex')"),
  order_id: z.string().optional().describe("Order ID associated with shipment"),
  order_date: z.string().optional().describe("Order creation date"),
  title: z.string().optional().describe("Shipment title/description"),
  customer_name: z.string().optional().describe("Customer name"),
  customer_email: z.string().optional().describe("Customer email"),
  customer_phone: z.string().optional().describe("Customer phone"),
  origin_country: z.string().optional().describe("Origin country code"),
  destination_country: z.string().optional().describe("Destination country code"),
  lastEvent: z.string().optional().describe("Last tracking event description"),
  lastStatus: z.string().optional().describe("Current status"),
  lastUpdateTime: z.string().optional().describe("Last update timestamp"),
  events: z
    .array(trackingEventSchema)
    .default([])
    .describe("Array of tracking events (immutable timeline)"),
});

/**
 * Create Tracking Request Schema
 */
export const createTrackingRequestSchema = z.object({
  tracking_number: z.string().min(1).describe("Tracking number to track"),
  courier_code: z
    .string()
    .min(1)
    .describe("Courier code (e.g., 'dhl', 'ups', 'fedex', 'usps')"),
  order_id: z.string().optional().describe("Optional order ID"),
  order_date: z.string().optional().describe("Optional order date"),
  destination_code: z.string().optional().describe("Optional destination country code"),
  tracking_ship_date: z.string().optional().describe("Optional ship date"),
  tracking_postal_code: z.string().optional().describe("Optional postal code"),
  lang: z.string().optional().describe("Language code (default: 'en')"),
  title: z.string().optional().describe("Optional shipment title"),
});

/**
 * Get Tracking Request Schema
 */
export const getTrackingRequestSchema = z.object({
  tracking_number: z.string().min(1).describe("Tracking number"),
  courier_code: z.string().optional().describe("Optional courier code"),
});

/**
 * Search Shipments Filter Schema
 */
export const searchShipmentsFilterSchema = z.object({
  courier_code: z.string().optional().describe("Filter by courier code"),
  tracking_number: z.string().optional().describe("Search by tracking number (partial match)"),
  page: z.number().min(1).optional().describe("Page number (default: 1)"),
  limit: z.number().min(1).max(100).optional().describe("Results per page (default: 50)"),
  created_date_min: z.string().optional().describe("Minimum creation date (ISO format)"),
  created_date_max: z.string().optional().describe("Maximum creation date (ISO format)"),
});

// Type exports
export type TrackingEvent = z.infer<typeof trackingEventSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type CreateTrackingRequest = z.infer<typeof createTrackingRequestSchema>;
export type GetTrackingRequest = z.infer<typeof getTrackingRequestSchema>;
export type SearchShipmentsFilter = z.infer<typeof searchShipmentsFilterSchema>;
