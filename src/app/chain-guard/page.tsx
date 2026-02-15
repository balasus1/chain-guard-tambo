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
      <div className="app-lovable-bg min-h-screen min-h-dvh flex flex-col">
        {/* Header */}
        <div className="border-b border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex-shrink-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
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
        <div className="border-b border-white/20 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur flex-shrink-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 flex-shrink-0 ${
                  activeTab === "search"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Track Shipment
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 flex-shrink-0 ${
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
        <div className="flex-1 overflow-auto min-h-0 bg-transparent">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            {activeTab === "search" ? (
              <Suspense fallback={<div>Loading...</div>}>
                <TrackingSearch />
              </Suspense>
            ) : (
              <div className="max-w-4xl mx-auto w-full">
                <MessageThreadFull
                  className="h-[calc(100dvh-140px)] sm:h-[calc(100vh-200px)] min-h-[320px]"
                  initialSuggestions={[
                    {
                      id: "handle-incident",
                      title: "Handle shipment",
                      detailedSuggestion: "Handle shipment FX9876543210 end-to-end",
                      messageId: "handle-incident-query",
                    },
                    {
                      id: "audit-shipment",
                      title: "Audit shipment",
                      detailedSuggestion: "Audit shipment FX9876543210",
                      messageId: "audit-query",
                    },
                    {
                      id: "list-shipments",
                      title: "List shipments",
                      detailedSuggestion: "Show me all shipments",
                      messageId: "list-query",
                    },
                  ]}
                />
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
