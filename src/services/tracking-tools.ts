/**
 * Tracking Tools for Tambo
 * 
 * These functions are registered as Tambo tools and can be called by AI
 * to interact with tracking data (using mock data for MVP).
 */

import {
  getShipmentByTrackingNumber,
  searchShipmentsByTrackingNumber,
  getAllShipments,
  getShipmentsByCourier,
  detectAnomalies,
} from "./mock-tracking-data";
import type { Shipment, TrackingEvent } from "@/lib/tracking-schemas";

/**
 * Tool: Create a new tracking (mock - returns existing or creates new)
 */
export async function createShipmentTracking(params: {
  tracking_number: string;
  courier_code: string;
  order_id?: string;
  order_date?: string;
  destination_code?: string;
  tracking_ship_date?: string;
  tracking_postal_code?: string;
  lang?: string;
  title?: string;
}): Promise<Shipment> {
  // Check if tracking already exists
  const existing = getShipmentByTrackingNumber(params.tracking_number);
  if (existing) {
    return existing;
  }

  // For MVP, return a new shipment with basic info
  // In production, this would call the real API
  return {
    id: `ship-${Date.now()}`,
    tracking_number: params.tracking_number,
    courier_code: params.courier_code,
    order_id: params.order_id,
    order_date: params.order_date,
    title: params.title || `Shipment ${params.tracking_number}`,
    lastEvent: "Tracking created",
    lastStatus: "pending",
    lastUpdateTime: new Date().toISOString(),
    events: [],
  };
}

/**
 * Tool: Get tracking information
 */
export async function getShipmentTracking(params: {
  tracking_number: string;
  courier_code?: string;
}): Promise<Shipment> {
  const shipment = getShipmentByTrackingNumber(params.tracking_number);
  
  if (!shipment) {
    throw new Error(
      `Tracking number ${params.tracking_number} not found. Try one of the example tracking numbers.`,
    );
  }

  return shipment;
}

/**
 * Tool: Search/list shipments
 */
export async function searchShipments(params?: {
  courier_code?: string;
  tracking_number?: string;
  page?: number;
  limit?: number;
  created_date_min?: string;
  created_date_max?: string;
}): Promise<Shipment[]> {
  let results: Shipment[];

  if (params?.tracking_number) {
    results = searchShipmentsByTrackingNumber(params.tracking_number);
  } else if (params?.courier_code) {
    results = getShipmentsByCourier(params.courier_code);
  } else {
    results = getAllShipments();
  }

  // Apply pagination
  if (params?.limit) {
    const page = params.page || 1;
    const start = (page - 1) * params.limit;
    const end = start + params.limit;
    results = results.slice(start, end);
  }

  return results;
}

/**
 * Tool: Detect anomalies in a shipment
 */
export async function detectShipmentAnomalies(params: {
  tracking_number: string;
}): Promise<{
  hasAnomaly: boolean;
  anomalies: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    timestamp: string;
  }>;
}> {
  const shipment = getShipmentByTrackingNumber(params.tracking_number);
  
  if (!shipment) {
    throw new Error(`Tracking number ${params.tracking_number} not found`);
  }

  return detectAnomalies(shipment);
}
