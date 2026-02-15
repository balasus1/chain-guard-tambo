"use client";

/**
 * Step 1 Verification Page - SLA Config
 *
 * Visit /sla-test to verify the SLA configuration loads correctly in the browser.
 */
import { useEffect, useState } from "react";

interface SlaApiResponse {
  success: boolean;
  config?: {
    version: string;
    description?: string;
    globalDefaults: Record<string, number>;
    vendorCount: number;
    routeRuleCount: number;
  };
  thresholds?: {
    warningHours: number;
    breachHours: number;
    customerVisibleHours: number;
  };
  testScenarios?: Array<{
    scenario: string;
    vendor: string;
    origin?: string;
    destination?: string;
    maxDays: number;
  }>;
  error?: string;
}

export default function SlaTestPage() {
  const [data, setData] = useState<SlaApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sla-config")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setData({ success: false, error: err.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading SLA config...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Step 1: SLA Config Verification</h1>
      <p className="text-muted-foreground mb-6">
        Archestra AI - Chain-Guard SLA configuration test
      </p>

      {data?.success === false ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="text-sm text-muted-foreground">{data.error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-4">
            <h2 className="font-semibold mb-2">Config Loaded</h2>
            {data?.config && (
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Version: {data.config.version}</li>
                <li>Description: {data.config.description ?? "—"}</li>
                <li>Vendors: {data.config.vendorCount}</li>
                <li>Route rules: {data.config.routeRuleCount}</li>
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border p-4">
            <h2 className="font-semibold mb-2">Global Defaults</h2>
            {data?.config?.globalDefaults && (
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Max transit (domestic): {data.config.globalDefaults.maxTransitDaysDomestic} days</li>
                <li>Max transit (international): {data.config.globalDefaults.maxTransitDaysInternational} days</li>
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border p-4">
            <h2 className="font-semibold mb-2">Delay Thresholds</h2>
            {data?.thresholds && (
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Warning: {data.thresholds.warningHours}h</li>
                <li>Breach: {data.thresholds.breachHours}h</li>
                <li>Customer-visible: {data.thresholds.customerVisibleHours}h</li>
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border p-4">
            <h2 className="font-semibold mb-2">getMaxTransitDays() Test Scenarios</h2>
            {data?.testScenarios && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Scenario</th>
                    <th className="py-2">Vendor</th>
                    <th className="py-2">Route</th>
                    <th className="py-2">Max Days</th>
                  </tr>
                </thead>
                <tbody>
                  {data.testScenarios.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{s.scenario}</td>
                      <td className="py-2">{s.vendor}</td>
                      <td className="py-2">
                        {s.origin && s.destination
                          ? `${s.origin} → ${s.destination}`
                          : "—"}
                      </td>
                      <td className="py-2 font-mono">{s.maxDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
            <p className="font-medium text-green-700 dark:text-green-400">
              ✓ Step 1 complete – SLA config loads correctly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
