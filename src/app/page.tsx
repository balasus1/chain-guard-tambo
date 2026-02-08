"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, ArrowRight, Shield, Clock, MapPin, AlertTriangle } from "lucide-react";
import { ApiKeyCheck } from "@/components/ApiKeyCheck";

const exampleTrackings = [
  { number: "1Z999AA10123456784", courier: "UPS", status: "Delivered" },
  { number: "1234567890", courier: "DHL", status: "In Transit" },
  { number: "FX9876543210", courier: "FedEx", status: "Route Deviation" },
  { number: "9405511899223197428490", courier: "USPS", status: "Temperature Alert" },
  { number: "TNT123456789", courier: "TNT", status: "Delayed" },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Navigate to chain-guard page with search query
      router.push(`/chain-guard?tracking=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleExampleClick = (trackingNumber: string) => {
    setSearchQuery(trackingNumber);
    router.push(`/chain-guard?tracking=${encodeURIComponent(trackingNumber)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Chain-Guard</h1>
                <p className="text-xs text-muted-foreground">
                  Immutable Auditing Tool for Logistics Tracking
                </p>
              </div>
            </div>
            <ApiKeyCheck>
              <a
                href="/chain-guard"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                AI Assistant →
              </a>
            </ApiKeyCheck>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Track Your Shipments
            <br />
            <span className="text-primary">With Complete Transparency</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get immutable timelines, detect anomalies, and maintain complete audit trails
            for your logistics operations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg shadow-lg p-2">
              <Search className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter tracking number (e.g., 1Z999AA10123456784)"
                className="flex-1 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground text-lg py-2"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? "Searching..." : "Track"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Example Trackings */}
        <div className="mb-16">
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            Try Example Tracking Numbers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {exampleTrackings.map((example) => (
              <button
                key={example.number}
                onClick={() => handleExampleClick(example.number)}
                className="p-4 bg-background border border-border rounded-lg hover:border-primary hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground">
                      {example.courier}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      example.status === "Delivered"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : example.status.includes("Alert") || example.status.includes("Deviation")
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : example.status === "Delayed"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {example.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                  {example.number}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 bg-background border border-border rounded-lg">
            <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Immutable Timeline</h3>
            <p className="text-sm text-muted-foreground">
              Complete audit trail with timestamps and locations for every event in your
              shipment journey.
            </p>
          </div>

          <div className="text-center p-6 bg-background border border-border rounded-lg">
            <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Anomaly Detection</h3>
            <p className="text-sm text-muted-foreground">
              Automatically detect delays, route deviations, temperature issues, and other
              anomalies in real-time.
            </p>
          </div>

          <div className="text-center p-6 bg-background border border-border rounded-lg">
            <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Geo-Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Visualize shipment routes and locations with detailed geographic tracking
              information.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <ApiKeyCheck>
            <a
              href="/chain-guard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Try AI Assistant
              <ArrowRight className="h-4 w-4" />
            </a>
          </ApiKeyCheck>
        </div>
      </main>
    </div>
  );
}
