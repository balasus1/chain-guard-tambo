"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { getShipmentByTrackingNumber, detectAnomalies } from "@/services/mock-tracking-data";
import { ShipmentCard } from "@/components/tambo/shipment-card";
import { Timeline } from "@/components/tambo/timeline";
import { AnomalyAlert } from "@/components/tambo/anomaly-alert";
import { TicketForm } from "@/components/tambo/ticket-form";
import { shipmentToTimelineEvents } from "@/lib/tracking-utils";
import type { Shipment } from "@/lib/tracking-schemas";

export function TrackingSearch() {
  const searchParams = useSearchParams();
  const initialTracking = searchParams.get("tracking") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialTracking);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);

  useEffect(() => {
    if (initialTracking) {
      handleSearch(initialTracking);
    }
  }, [initialTracking]);

  const handleSearch = async (query?: string) => {
    const trackingNumber = query || searchQuery.trim();
    if (!trackingNumber) return;

    setIsSearching(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const found = getShipmentByTrackingNumber(trackingNumber);
    setShipment(found);
    setIsSearching(false);
  };

  const handleReportAnomaly = (anomaly: any) => {
    setSelectedAnomaly(anomaly);
    setShowTicketForm(true);
  };

  const anomalies = shipment ? detectAnomalies(shipment) : null;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-background border border-border rounded-lg p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter tracking number..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Results */}
      {isSearching && (
        <div className="text-center py-12 text-muted-foreground">
          Searching for tracking information...
        </div>
      )}

      {!isSearching && !shipment && searchQuery && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No tracking found for "{searchQuery}"
          </p>
          <p className="text-sm text-muted-foreground">
            Try one of the example tracking numbers from the home page.
          </p>
        </div>
      )}

      {!isSearching && shipment && (
        <div className="space-y-6">
          {/* Shipment Card */}
          <ShipmentCard
            trackingNumber={shipment.tracking_number}
            courierCode={shipment.courier_code}
            status={shipment.lastStatus}
            lastEvent={shipment.lastEvent}
            lastUpdateTime={shipment.lastUpdateTime}
            origin={{
              country: shipment.origin_country,
            }}
            destination={{
              country: shipment.destination_country,
            }}
            orderId={shipment.order_id}
            orderDate={shipment.order_date}
            title={shipment.title}
            variant="detailed"
          />

          {/* Anomalies */}
          {anomalies && anomalies.hasAnomaly && (
            <AnomalyAlert
              anomalies={anomalies.anomalies}
              trackingNumber={shipment.tracking_number}
              onReportAnomaly={handleReportAnomaly}
            />
          )}

          {/* Ticket Form */}
          {showTicketForm && (
            <TicketForm
              trackingNumber={shipment.tracking_number}
              subject={`Issue with shipment ${shipment.tracking_number}`}
              anomalyType={selectedAnomaly?.type}
              onSubmit={(data) => {
                console.log("Ticket submitted:", data);
                // In production, this would send to your API
                alert(`Ticket submitted! We'll contact you at ${data.email}`);
              }}
              onClose={() => {
                setShowTicketForm(false);
                setSelectedAnomaly(null);
              }}
            />
          )}

          {/* Timeline */}
          <Timeline
            title={`Tracking Timeline - ${shipment.tracking_number}`}
            events={shipmentToTimelineEvents(shipment)}
            variant="detailed"
            size="lg"
            showTimestamps={true}
            showLocations={true}
          />
        </div>
      )}

      {!isSearching && !shipment && !searchQuery && (
        <div className="text-center py-12 text-muted-foreground">
          Enter a tracking number above to get started
        </div>
      )}
    </div>
  );
}
