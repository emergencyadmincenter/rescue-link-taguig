/**
 * Flood Risk Estimation Utility
 *
 * IMPORTANT — THESIS DEFENSE NOTE:
 * This is a RULE-BASED RISK ESTIMATE, NOT a precise flood prediction/forecast.
 * There is no real API that predicts "this barangay floods in X hours."
 * The risk levels shown are derived from a simple weighted function combining
 * current rainfall data with static flood-prone area flags.
 *
 * DO NOT present this as a forecast or prediction in the UI or defense.
 *
 * TODO: BACKEND — REAL IMPLEMENTATION REQUIREMENTS
 * A production-grade flood risk system would need:
 *
 * 1. RAINFALL ACCUMULATION OVER TIME — Not just a current snapshot, but
 *    accumulated rainfall over the past 1h, 3h, 6h, 12h, and 24h windows.
 *    Current implementation only uses the instantaneous precipitation value.
 *
 * 2. HISTORICAL FLOOD DATA PER BARANGAY — Actual records of past flooding
 *    events (dates, severity, affected areas) from the Taguig LGU or NDRRMC.
 *    Currently mocked with a static boolean flag.
 *
 * 3. DRAINAGE CAPACITY DATA — Information about drainage infrastructure,
 *    pumping stations, and their operational status per barangay.
 *    Not currently available from any public data source.
 *
 * 4. REAL-TIME RIVER/WATERWAY LEVEL DATA — Water levels from Laguna Lake,
 *    Taguig River, Napindan Channel, and other waterways.
 *    PAGASA or local monitoring stations may provide this.
 *
 * 5. TERRAIN/ELEVATION DATA — Actual elevation and flood hazard maps from
 *    Project NOAH (https://noah.up.edu.ph/) or PhilLIDAR.
 *    Currently approximated with a static isFloodProneArea flag.
 *
 * 6. OPEN-METEO FLOOD API — Provides river discharge forecast data based on
 *    GloFAS (Global Flood Awareness System). Available at:
 *    https://open-meteo.com/en/docs/flood-api
 *    CAVEAT: Its ~5km grid resolution will NOT distinguish individual
 *    barangays well within Taguig City. Useful as a supplementary signal
 *    for broader river discharge trends, not barangay-level precision.
 *
 * None of these data sources are currently wired to a live backend.
 */

import type { BarangayWeather } from "../types/weather.types";

// --- Flood Risk Types ---

export type FloodRiskLevel = "low" | "moderate" | "elevated" | "high";

export interface FloodRiskResult {
  /** The computed risk tier */
  level: FloodRiskLevel;
  /** A plain-language explanation of the risk factors */
  description: string;
  /** Numeric score (0–100) used internally for sorting/filtering */
  score: number;
}

// --- Flood-Prone Area Registry ---

/**
 * Static registry of barangays known to be flood-prone.
 *
 * TODO: BACKEND — This flag needs to come from real LGU/NOAH flood hazard
 * map data, not guessed. These are placeholder designations based on
 * general knowledge of low-lying / waterway-adjacent areas in Taguig.
 * Real data should come from:
 *   - Project NOAH flood hazard maps (https://noah.up.edu.ph/)
 *   - Taguig City DRRMO flood history records
 *   - PhilLIDAR elevation/terrain data
 */
const FLOOD_PRONE_BARANGAYS: Set<string> = new Set([
  "brgy-napindan",     // Adjacent to Napindan Channel / Laguna Lake
  "brgy-wawa",         // Low-lying, near Taguig River outlet
  "brgy-hagonoy",      // Low-lying area with flood history
  "brgy-ususan",       // Near waterways, historically flood-affected
  "brgy-bagumbayan",   // Adjacent to flood-prone low-lying zones
  "brgy-lower-bicutan", // Low-elevation area
  "brgy-ibayo-tipas",  // Near Pasig River, historically flood-prone
  "brgy-palingon-tipas", // Near Pasig River
  "brgy-santa-ana",    // Near waterways
  "brgy-ligid-tipas",  // Near Pasig River
]);

/**
 * Check if a barangay is in a known flood-prone area.
 *
 * TODO: BACKEND — Replace with database lookup against real flood hazard
 * zone data from Project NOAH or Taguig DRRMO.
 */
export function isFloodProneArea(barangayId: string): boolean {
  return FLOOD_PRONE_BARANGAYS.has(barangayId);
}

// --- Risk Calculation ---

/**
 * Weights for the risk calculation factors.
 * These are tuned for a reasonable mock demonstration — NOT calibrated
 * against real flood data.
 *
 * TODO: BACKEND — Calibrate weights against historical flood events
 * once real data is available.
 */
const WEIGHTS = {
  precipitationChance: 0.35, // How likely it is to rain (0–100%)
  precipitation: 0.35,       // Current rainfall intensity (mm)
  floodProneArea: 0.30,      // Whether the area is historically flood-prone
} as const;

/**
 * Thresholds for converting numeric score to risk tier.
 * Score range: 0–100
 */
const RISK_THRESHOLDS = {
  high: 70,
  elevated: 45,
  moderate: 25,
} as const;

/**
 * Normalizes precipitation amount to a 0–100 scale.
 * Assumes 25mm+ is maximum severity for this estimate.
 *
 * TODO: BACKEND — Calibrate against actual flooding thresholds
 * for Taguig City drainage capacity.
 */
function normalizePrecipitation(mm: number): number {
  return Math.min((mm / 25) * 100, 100);
}

/**
 * Computes a flood risk estimate for a single barangay based on its
 * current weather data and flood-prone status.
 *
 * This is a SIMPLE WEIGHTED RULE FUNCTION — not a predictive model.
 * It combines:
 *   1. Precipitation chance (from existing weather data)
 *   2. Current precipitation amount (from existing weather data)
 *   3. Static flood-prone area flag (mocked per barangay)
 *
 * The output is a tiered risk level (Low → High) with a plain-language
 * explanation. No time-based predictions (e.g., "floods in 3 hours")
 * are made — we cannot back such claims.
 */
export function calculateFloodRisk(weather: BarangayWeather): FloodRiskResult {
  const floodProne = isFloodProneArea(weather.id);

  // Normalize inputs to 0–100 scale
  const precipChanceScore = weather.precipitationChance; // Already 0–100
  const precipAmountScore = normalizePrecipitation(weather.precipitation);
  const floodProneScore = floodProne ? 100 : 0;

  // Weighted sum
  const score = Math.round(
    precipChanceScore * WEIGHTS.precipitationChance +
    precipAmountScore * WEIGHTS.precipitation +
    floodProneScore * WEIGHTS.floodProneArea
  );

  // Determine risk level
  const level: FloodRiskLevel =
    score >= RISK_THRESHOLDS.high
      ? "high"
      : score >= RISK_THRESHOLDS.elevated
        ? "elevated"
        : score >= RISK_THRESHOLDS.moderate
          ? "moderate"
          : "low";

  // Build plain-language description
  const description = buildRiskDescription(level, weather, floodProne);

  return { level, description, score };
}

/**
 * Generates a human-readable description of why a particular risk level
 * was assigned. Avoids specific time claims like "floods in X hours."
 */
function buildRiskDescription(
  level: FloodRiskLevel,
  weather: BarangayWeather,
  floodProne: boolean
): string {
  const rainIntensity =
    weather.precipitation >= 15
      ? "heavy rain"
      : weather.precipitation >= 5
        ? "moderate rain"
        : weather.precipitationChance >= 60
          ? "high rain probability"
          : weather.precipitationChance >= 30
            ? "some rain expected"
            : "light or no rain";

  const areaContext = floodProne ? "flood-prone area" : "no significant flood history";

  switch (level) {
    case "high":
      return `High risk — ${rainIntensity} + ${areaContext}. Risk may increase if rain continues.`;
    case "elevated":
      return `Elevated risk — ${rainIntensity} + ${areaContext}. Monitor conditions closely.`;
    case "moderate":
      return `Moderate risk — ${rainIntensity}, ${areaContext}. Stay alert for changing conditions.`;
    case "low":
      return `Low risk — ${rainIntensity}, ${areaContext}.`;
  }
}

/**
 * Returns display configuration for a flood risk level.
 * Uses distinct visual treatment from the weather severity badges
 * to avoid confusion.
 */
export function getFloodRiskConfig(level: FloodRiskLevel): {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  borderColor: string;
} {
  switch (level) {
    case "high":
      return {
        label: "High",
        bgColor: "bg-red-100",
        textColor: "text-red-700",
        dotColor: "bg-red-500",
        borderColor: "border-red-200",
      };
    case "elevated":
      return {
        label: "Elevated",
        bgColor: "bg-orange-100",
        textColor: "text-orange-700",
        dotColor: "bg-orange-500",
        borderColor: "border-orange-200",
      };
    case "moderate":
      return {
        label: "Moderate",
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
        dotColor: "bg-amber-500",
        borderColor: "border-amber-200",
      };
    case "low":
      return {
        label: "Low",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
        dotColor: "bg-emerald-500",
        borderColor: "border-emerald-200",
      };
  }
}
