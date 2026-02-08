/**
 * Mock Tracking Data Service
 * 
 * Provides sample tracking data for Chain-Guard MVP demo
 * Simulates real tracking data with various scenarios including anomalies
 */

import type { Shipment, TrackingEvent } from "@/lib/tracking-schemas";

// Sample tracking events with different scenarios
const sampleEvents: Record<string, TrackingEvent[]> = {
  // Normal delivery - UPS
  "1Z999AA10123456784": [
    {
      checkpoint_time: "2024-01-15T08:00:00Z",
      checkpoint_date: "2024-01-15",
      tracking_detail: "Shipment information sent to FedEx",
      location: "New York Distribution Center",
      city: "New York",
      state: "NY",
      country: "US",
      country_name: "United States",
      zip: "10001",
    },
    {
      checkpoint_time: "2024-01-15T10:30:00Z",
      checkpoint_date: "2024-01-15",
      tracking_detail: "Picked up",
      location: "New York Distribution Center",
      city: "New York",
      state: "NY",
      country: "US",
      country_name: "United States",
      zip: "10001",
    },
    {
      checkpoint_time: "2024-01-16T14:20:00Z",
      checkpoint_date: "2024-01-16",
      tracking_detail: "In transit",
      location: "Philadelphia Hub",
      city: "Philadelphia",
      state: "PA",
      country: "US",
      country_name: "United States",
      zip: "19101",
    },
    {
      checkpoint_time: "2024-01-17T09:15:00Z",
      checkpoint_date: "2024-01-17",
      tracking_detail: "Out for delivery",
      location: "Los Angeles Distribution Center",
      city: "Los Angeles",
      state: "CA",
      country: "US",
      country_name: "United States",
      zip: "90001",
    },
    {
      checkpoint_time: "2024-01-17T14:45:00Z",
      checkpoint_date: "2024-01-17",
      tracking_detail: "Delivered",
      location: "Los Angeles",
      city: "Los Angeles",
      state: "CA",
      country: "US",
      country_name: "United States",
      zip: "90001",
    },
  ],

  // Delayed shipment - DHL
  "1234567890": [
    {
      checkpoint_time: "2024-01-10T09:00:00Z",
      checkpoint_date: "2024-01-10",
      tracking_detail: "Shipment information received",
      location: "London Hub",
      city: "London",
      country: "GB",
      country_name: "United Kingdom",
      zip: "SW1A 1AA",
    },
    {
      checkpoint_time: "2024-01-10T12:30:00Z",
      checkpoint_date: "2024-01-10",
      tracking_detail: "Picked up",
      location: "London Hub",
      city: "London",
      country: "GB",
      country_name: "United Kingdom",
      zip: "SW1A 1AA",
    },
    {
      checkpoint_time: "2024-01-11T08:00:00Z",
      checkpoint_date: "2024-01-11",
      tracking_detail: "In transit to destination country",
      location: "London Airport",
      city: "London",
      country: "GB",
      country_name: "United Kingdom",
      zip: "SW1A 1AA",
    },
    {
      checkpoint_time: "2024-01-12T10:00:00Z",
      checkpoint_date: "2024-01-12",
      tracking_detail: "Arrived at destination country",
      location: "New York JFK Airport",
      city: "New York",
      state: "NY",
      country: "US",
      country_name: "United States",
      zip: "11430",
    },
    {
      checkpoint_time: "2024-01-13T08:00:00Z",
      checkpoint_date: "2024-01-13",
      tracking_detail: "Customs clearance delay",
      location: "New York Customs",
      city: "New York",
      state: "NY",
      country: "US",
      country_name: "United States",
      zip: "11430",
    },
    {
      checkpoint_time: "2024-01-15T11:00:00Z",
      checkpoint_date: "2024-01-15",
      tracking_detail: "Customs clearance completed",
      location: "New York Customs",
      city: "New York",
      state: "NY",
      country: "US",
      country_name: "United States",
      zip: "11430",
    },
    {
      checkpoint_time: "2024-01-15T14:00:00Z",
      checkpoint_date: "2024-01-15",
      tracking_detail: "In transit to final destination",
      location: "New York Distribution Center",
      city: "New York",
      state: "NY",
      country: "US",
      country_name: "United States",
      zip: "10001",
    },
  ],

  // Anomaly - Route deviation - FedEx
  "FX9876543210": [
    {
      checkpoint_time: "2024-01-20T08:00:00Z",
      checkpoint_date: "2024-01-20",
      tracking_detail: "Shipment information sent to FedEx",
      location: "Chicago Distribution Center",
      city: "Chicago",
      state: "IL",
      country: "US",
      country_name: "United States",
      zip: "60601",
    },
    {
      checkpoint_time: "2024-01-20T10:00:00Z",
      checkpoint_date: "2024-01-20",
      tracking_detail: "Picked up",
      location: "Chicago Distribution Center",
      city: "Chicago",
      state: "IL",
      country: "US",
      country_name: "United States",
      zip: "60601",
    },
    {
      checkpoint_time: "2024-01-21T09:00:00Z",
      checkpoint_date: "2024-01-21",
      tracking_detail: "In transit",
      location: "Detroit Hub",
      city: "Detroit",
      state: "MI",
      country: "US",
      country_name: "United States",
      zip: "48201",
    },
    {
      checkpoint_time: "2024-01-22T11:00:00Z",
      checkpoint_date: "2024-01-22",
      tracking_detail: "Unexpected route deviation - Package rerouted",
      location: "Atlanta Hub",
      city: "Atlanta",
      state: "GA",
      country: "US",
      country_name: "United States",
      zip: "30301",
    },
    {
      checkpoint_time: "2024-01-23T08:00:00Z",
      checkpoint_date: "2024-01-23",
      tracking_detail: "Back on route",
      location: "Miami Distribution Center",
      city: "Miami",
      state: "FL",
      country: "US",
      country_name: "United States",
      zip: "33101",
    },
  ],

  // Temperature anomaly - USPS
  "9405511899223197428490": [
    {
      checkpoint_time: "2024-01-18T07:00:00Z",
      checkpoint_date: "2024-01-18",
      tracking_detail: "Pre-Shipment Info Sent to USPS",
      location: "Phoenix Processing Center",
      city: "Phoenix",
      state: "AZ",
      country: "US",
      country_name: "United States",
      zip: "85001",
    },
    {
      checkpoint_time: "2024-01-18T10:00:00Z",
      checkpoint_date: "2024-01-18",
      tracking_detail: "Accepted at USPS Origin Facility",
      location: "Phoenix Processing Center",
      city: "Phoenix",
      state: "AZ",
      country: "US",
      country_name: "United States",
      zip: "85001",
    },
    {
      checkpoint_time: "2024-01-19T14:00:00Z",
      checkpoint_date: "2024-01-19",
      tracking_detail: "Temperature threshold exceeded - Cold chain breach detected",
      location: "Las Vegas Processing Center",
      city: "Las Vegas",
      state: "NV",
      country: "US",
      country_name: "United States",
      zip: "89101",
    },
    {
      checkpoint_time: "2024-01-19T16:00:00Z",
      checkpoint_date: "2024-01-19",
      tracking_detail: "Package moved to temperature-controlled storage",
      location: "Las Vegas Processing Center",
      city: "Las Vegas",
      state: "NV",
      country: "US",
      country_name: "United States",
      zip: "89101",
    },
    {
      checkpoint_time: "2024-01-20T09:00:00Z",
      checkpoint_date: "2024-01-20",
      tracking_detail: "In transit to destination",
      location: "Las Vegas Processing Center",
      city: "Las Vegas",
      state: "NV",
      country: "US",
      country_name: "United States",
      zip: "89101",
    },
  ],

  // Stuck in transit - TNT
  "TNT123456789": [
    {
      checkpoint_time: "2024-01-05T08:00:00Z",
      checkpoint_date: "2024-01-05",
      tracking_detail: "Shipment collected",
      location: "Amsterdam Hub",
      city: "Amsterdam",
      country: "NL",
      country_name: "Netherlands",
      zip: "1012 AB",
    },
    {
      checkpoint_time: "2024-01-06T10:00:00Z",
      checkpoint_date: "2024-01-06",
      tracking_detail: "In transit",
      location: "Amsterdam Hub",
      city: "Amsterdam",
      country: "NL",
      country_name: "Netherlands",
      zip: "1012 AB",
    },
    {
      checkpoint_time: "2024-01-08T14:00:00Z",
      checkpoint_date: "2024-01-08",
      tracking_detail: "Arrived at transit facility",
      location: "Paris Hub",
      city: "Paris",
      country: "FR",
      country_name: "France",
      zip: "75001",
    },
    {
      checkpoint_time: "2024-01-10T09:00:00Z",
      checkpoint_date: "2024-01-10",
      tracking_detail: "In transit - No update for 48+ hours",
      location: "Paris Hub",
      city: "Paris",
      country: "FR",
      country_name: "France",
      zip: "75001",
    },
  ],
};

// Sample shipments
const sampleShipments: Shipment[] = [
  {
    id: "ship-1",
    tracking_number: "1Z999AA10123456784",
    courier_code: "ups",
    order_id: "ORD-2024-001",
    order_date: "2024-01-14",
    title: "Electronics Package",
    origin_country: "US",
    destination_country: "US",
    lastEvent: "Delivered",
    lastStatus: "delivered",
    lastUpdateTime: "2024-01-17T14:45:00Z",
    events: sampleEvents["1Z999AA10123456784"] || [],
  },
  {
    id: "ship-2",
    tracking_number: "1234567890",
    courier_code: "dhl",
    order_id: "ORD-2024-002",
    order_date: "2024-01-09",
    title: "International Shipment",
    origin_country: "GB",
    destination_country: "US",
    lastEvent: "In transit to final destination",
    lastStatus: "in_transit",
    lastUpdateTime: "2024-01-15T14:00:00Z",
    events: sampleEvents["1234567890"] || [],
  },
  {
    id: "ship-3",
    tracking_number: "FX9876543210",
    courier_code: "fedex",
    order_id: "ORD-2024-003",
    order_date: "2024-01-19",
    title: "Express Delivery",
    origin_country: "US",
    destination_country: "US",
    lastEvent: "Back on route",
    lastStatus: "in_transit",
    lastUpdateTime: "2024-01-23T08:00:00Z",
    events: sampleEvents["FX9876543210"] || [],
  },
  {
    id: "ship-4",
    tracking_number: "9405511899223197428490",
    courier_code: "usps",
    order_id: "ORD-2024-004",
    order_date: "2024-01-17",
    title: "Temperature-Sensitive Package",
    origin_country: "US",
    destination_country: "US",
    lastEvent: "In transit to destination",
    lastStatus: "in_transit",
    lastUpdateTime: "2024-01-20T09:00:00Z",
    events: sampleEvents["9405511899223197428490"] || [],
  },
  {
    id: "ship-5",
    tracking_number: "TNT123456789",
    courier_code: "tnt",
    order_id: "ORD-2024-005",
    order_date: "2024-01-04",
    title: "European Shipment",
    origin_country: "NL",
    destination_country: "FR",
    lastEvent: "In transit - No update for 48+ hours",
    lastStatus: "exception",
    lastUpdateTime: "2024-01-10T09:00:00Z",
    events: sampleEvents["TNT123456789"] || [],
  },
];

/**
 * Get shipment by tracking number
 */
export function getShipmentByTrackingNumber(
  trackingNumber: string,
): Shipment | null {
  const normalized = trackingNumber.trim().toUpperCase();
  return (
    sampleShipments.find(
      (s) => s.tracking_number.toUpperCase() === normalized,
    ) || null
  );
}

/**
 * Search shipments by tracking number (partial match)
 */
export function searchShipmentsByTrackingNumber(
  query: string,
): Shipment[] {
  if (!query || query.trim() === "") {
    return sampleShipments;
  }

  const normalizedQuery = query.trim().toUpperCase();
  return sampleShipments.filter((shipment) =>
    shipment.tracking_number.toUpperCase().includes(normalizedQuery),
  );
}

/**
 * Get all shipments
 */
export function getAllShipments(): Shipment[] {
  return [...sampleShipments];
}

/**
 * Get shipments by courier
 */
export function getShipmentsByCourier(courierCode: string): Shipment[] {
  return sampleShipments.filter(
    (s) => s.courier_code.toLowerCase() === courierCode.toLowerCase(),
  );
}

/**
 * Detect anomalies in a shipment
 */
export function detectAnomalies(shipment: Shipment): {
  hasAnomaly: boolean;
  anomalies: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    timestamp: string;
  }>;
} {
  const anomalies: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    timestamp: string;
  }> = [];

  // Check for delays
  if (shipment.events.length > 0) {
    const lastEvent = shipment.events[shipment.events.length - 1];
    const lastEventTime = new Date(
      lastEvent.checkpoint_time || lastEvent.checkpoint_date,
    );
    const now = new Date();
    const hoursSinceLastUpdate =
      (now.getTime() - lastEventTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastUpdate > 48 && shipment.lastStatus !== "delivered") {
      anomalies.push({
        type: "delay",
        severity: hoursSinceLastUpdate > 72 ? "high" : "medium",
        description: `No update for ${Math.round(hoursSinceLastUpdate)} hours`,
        timestamp: lastEvent.checkpoint_time || lastEvent.checkpoint_date,
      });
    }
  }

  // Check for route deviations
  const routeDeviationEvents = shipment.events.filter((e) =>
    e.tracking_detail.toLowerCase().includes("deviation") ||
    e.tracking_detail.toLowerCase().includes("rerouted"),
  );
  if (routeDeviationEvents.length > 0) {
    anomalies.push({
      type: "route_deviation",
      severity: "medium",
      description: "Unexpected route deviation detected",
      timestamp:
        routeDeviationEvents[0].checkpoint_time ||
        routeDeviationEvents[0].checkpoint_date,
    });
  }

  // Check for temperature issues
  const tempEvents = shipment.events.filter(
    (e) =>
      e.tracking_detail.toLowerCase().includes("temperature") ||
      e.tracking_detail.toLowerCase().includes("cold chain"),
  );
  if (tempEvents.length > 0) {
    anomalies.push({
      type: "temperature",
      severity: "high",
      description: "Temperature threshold breach detected",
      timestamp:
        tempEvents[0].checkpoint_time || tempEvents[0].checkpoint_date,
    });
  }

  // Check for customs delays
  const customsEvents = shipment.events.filter((e) =>
    e.tracking_detail.toLowerCase().includes("customs"),
  );
  if (customsEvents.length > 1) {
    const delayEvent = customsEvents.find((e) =>
      e.tracking_detail.toLowerCase().includes("delay"),
    );
    if (delayEvent) {
      anomalies.push({
        type: "customs_delay",
        severity: "medium",
        description: "Customs clearance delay",
        timestamp:
          delayEvent.checkpoint_time || delayEvent.checkpoint_date,
      });
    }
  }

  return {
    hasAnomaly: anomalies.length > 0,
    anomalies,
  };
}

export { sampleShipments, sampleEvents };
