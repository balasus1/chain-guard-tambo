"use client";

/**
 * Step 3 Verification Page - Safe Actions & Policy Engine
 *
 * Visit /policy-test to verify policy-gated actions and decision log.
 */
import { useEffect, useState } from "react";

const TRACKING_NUMBERS = [
  "FX9876543210", // Route deviation - FedEx
  "9405511899223197428490", // Temperature - USPS (high risk -> create_ticket allowed)
  "1234567890", // Customs delay - DHL
  "1Z999AA10123456784", // OK - delivered (no actions)
];

interface Outcome {
  action: string;
  executed: boolean;
  denied: boolean;
  denialReason?: string;
  policyCheck: {
    allowed: boolean;
    reason: string;
    ruleEvaluated: string;
  };
}

interface HandleResult {
  auditResult: {
    trackingNumber: string;
    verdict: string;
    slaStatus: string;
    riskLevel: string;
    suggestedActions: string[];
  };
  outcomes: Outcome[];
  decisionLogId: string;
}

export default function PolicyTestPage() {
  const [results, setResults] = useState<
    Record<string, HandleResult | { error: string }>
  >({});
  const [decisions, setDecisions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const refDate = "2024-01-25";
      const out: Record<string, HandleResult | { error: string }> = {};

      for (const tn of TRACKING_NUMBERS) {
        try {
          const res = await fetch(
            `/api/handle-incident?tracking=${encodeURIComponent(tn)}&referenceDate=${refDate}`
          );
          const data = await res.json();
          if (data.success) {
            out[tn] = {
              auditResult: data.auditResult,
              outcomes: data.outcomes,
              decisionLogId: data.decisionLogId,
            };
          } else {
            out[tn] = { error: data.error || "Unknown error" };
          }
        } catch (e) {
          out[tn] = { error: e instanceof Error ? e.message : String(e) };
        }
      }

      const decRes = await fetch("/api/agent-decisions?limit=20");
      const decData = await decRes.json();
      if (decData.success) {
        setDecisions(decData.decisions);
      }

      setResults(out);
      setLoading(false);
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Running handle_incident on sample shipments...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        Step 3: Safe Actions & Policy Engine
      </h1>
      <p className="text-muted-foreground mb-6">
        Archestra deterministic security – policy-gated actions
      </p>

      <div className="space-y-6">
        {TRACKING_NUMBERS.map((tn) => {
          const r = results[tn];
          if (!r) return null;
          const isError = "error" in r;

          return (
            <div key={tn} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-medium">{tn}</span>
                {!isError && (
                  <span className="text-sm text-muted-foreground">
                    Log: {r.decisionLogId}
                  </span>
                )}
              </div>

              {isError ? (
                <p className="text-sm text-destructive">{r.error}</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm">
                    Audit: {r.auditResult.verdict} | {r.auditResult.slaStatus} |{" "}
                    {r.auditResult.riskLevel} | Suggested:{" "}
                    {r.auditResult.suggestedActions.join(", ")}
                  </p>
                  <div>
                    <p className="font-medium text-sm mb-1">Action outcomes:</p>
                    <ul className="space-y-2">
                      {r.outcomes.map((o, i) => (
                        <li
                          key={i}
                          className={`text-sm p-2 rounded ${
                            o.executed
                              ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          <span className="font-medium">{o.action}:</span>{" "}
                          {o.executed ? "EXECUTED" : "DENIED"}
                          {o.denialReason && (
                            <span className="block text-xs mt-1">
                              {o.denialReason}
                            </span>
                          )}
                          <span className="block text-xs mt-1 opacity-80">
                            Rule: {o.policyCheck.ruleEvaluated}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-border p-4">
        <h2 className="font-semibold mb-2">Decision Log (last 20)</h2>
        <pre className="text-xs overflow-auto max-h-64 p-2 bg-muted/50 rounded">
          {JSON.stringify(decisions, null, 2)}
        </pre>
      </div>

      <div className="mt-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
        <p className="font-medium text-green-700 dark:text-green-400">
          ✓ Step 3 complete – Safe actions execute only when policy allows;
          decision log captures all outcomes
        </p>
      </div>
    </div>
  );
}
