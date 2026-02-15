/**
 * SLA Configuration Loader for Archestra
 *
 * Loads and provides access to the SLA configuration used by the audit agent.
 */

import type { SlaConfig } from "./types";

import slaConfigData from "@/data/sla-config.json";

const cachedConfig = slaConfigData as SlaConfig;

/**
 * Load SLA configuration from JSON.
 */
export function loadSlaConfig(): SlaConfig {
  return cachedConfig;
}

/**
 * Get max transit days for a vendor and route
 */
export function getMaxTransitDays(
  config: SlaConfig,
  vendor: string,
  originCountry?: string,
  destinationCountry?: string,
  isTemperatureSensitive?: boolean
): number {
  if (isTemperatureSensitive && config.temperatureSensitiveRules) {
    return config.temperatureSensitiveRules.maxTransitDays;
  }

  const vendorOverride = config.vendorOverrides[vendor.toLowerCase()];
  const isInternational =
    originCountry &&
    destinationCountry &&
    originCountry !== destinationCountry;

  if (config.routeRules && originCountry && destinationCountry) {
    const routeRule = config.routeRules.find(
      (r) =>
        r.origin.toUpperCase() === originCountry.toUpperCase() &&
        r.destination.toUpperCase() === destinationCountry.toUpperCase()
    );
    if (routeRule) {
      return routeRule.maxTransitDays;
    }
  }

  if (vendorOverride) {
    return isInternational
      ? (vendorOverride.maxTransitDaysInternational ??
          config.globalDefaults.maxTransitDaysInternational)
      : (vendorOverride.maxTransitDaysDomestic ??
          config.globalDefaults.maxTransitDaysDomestic);
  }

  return isInternational
    ? config.globalDefaults.maxTransitDaysInternational
    : config.globalDefaults.maxTransitDaysDomestic;
}

/**
 * Get delay thresholds (hours) from config
 */
export function getDelayThresholds(config: SlaConfig): {
  warningHours: number;
  breachHours: number;
  customerVisibleHours: number;
} {
  return {
    warningHours: config.globalDefaults.warningDelayHours,
    breachHours: config.globalDefaults.breachDelayHours,
    customerVisibleHours: config.globalDefaults.customerVisibleDelayHours,
  };
}
