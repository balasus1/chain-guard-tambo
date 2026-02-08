"use client";

import { useState, Suspense } from "react";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { TrackingSearch } from "@/components/tracking-search";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { Package, MessageSquare } from "lucide-react";
import Link from "next/link";

/**
 * Chain-Guard Page
 * 
 * Main page for Chain-Guard - an immutable auditing tool for logistics tracking.
 * Uses Tambo AI to provide intelligent, conversational interfaces for supply chain monitoring.
 * 
 * @remarks
 * The `NEXT_PUBLIC_TAMBO_URL` environment variable specifies the URL of the Tambo server.
 * You do not need to set it if you are using the default Tambo server.
 * It is only required if you are running the API server locally.
 */
function ChainGuardContent() {
  const [activeTab, setActiveTab] = useState<"search" | "ai">("search");
  const mcpServers = useMcpServers();

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Chain-Guard
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Immutable Auditing Tool for Logistics Tracking
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-background/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "search"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Track Shipment
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === "ai"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === "search" ? (
              <Suspense fallback={<div>Loading...</div>}>
                <TrackingSearch />
              </Suspense>
            ) : (
              <div className="max-w-4xl mx-auto">
                <MessageThreadFull className="h-[calc(100vh-200px)]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}

export default function ChainGuardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChainGuardContent />
    </Suspense>
  );
}
