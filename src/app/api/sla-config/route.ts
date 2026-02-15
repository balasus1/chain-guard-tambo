/**
 * API route to verify SLA config loading (Step 1 verification)
 */
import { loadSlaConfig, getMaxTransitDays, getDelayThresholds } from "@/lib/archestra/sla-config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = loadSlaConfig();
    const thresholds = getDelayThresholds(config);

    // Test getMaxTransitDays for different scenarios
    const testScenarios = [
      {
        scenario: "UPS domestic",
        vendor: "ups",
        origin: "US",
        destination: "US",
        maxDays: getMaxTransitDays(config, "ups", "US", "US"),
      },
      {
        scenario: "DHL international",
        vendor: "dhl",
        origin: "GB",
        destination: "US",
        maxDays: getMaxTransitDays(config, "dhl", "GB", "US"),
      },
      {
        scenario: "FedEx domestic",
        vendor: "fedex",
        origin: "US",
        destination: "US",
        maxDays: getMaxTransitDays(config, "fedex", "US", "US"),
      },
      {
        scenario: "Temperature-sensitive",
        vendor: "usps",
        maxDays: getMaxTransitDays(config, "usps", "US", "US", true),
      },
    ];

    return NextResponse.json({
      success: true,
      config: {
        version: config.version,
        description: config.description,
        globalDefaults: config.globalDefaults,
        vendorCount: Object.keys(config.vendorOverrides).length,
        routeRuleCount: config.routeRules.length,
      },
      thresholds: {
        warningHours: thresholds.warningHours,
        breachHours: thresholds.breachHours,
        customerVisibleHours: thresholds.customerVisibleHours,
      },
      testScenarios,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
