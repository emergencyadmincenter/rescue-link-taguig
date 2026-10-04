/**
 * Flood Risk Estimation Utility
 *
 * This implements a comprehensive, multi-factor rule-based risk estimate.
 * It evaluates:
 *  1. Rain duration (persistence)
 *  2. Rainfall intensity (volume)
 *  3. Precipitation probability (forecast)
 *  4. Hyper-local geographic vulnerabilities (elevation, drainage, waterways)
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

interface LocationFactors {
  elevation: "low" | "moderate" | "high";
  waterwayProximity: boolean; // Taguig River, Laguna Lake, Napindan Channel, etc.
  drainageQuality: "poor" | "fair" | "good";
}

// --- Enhanced Terrain & Infrastructure Registry ---

/**
 * Registry of localized vulnerability factors based on Taguig City's geography.
 * Replaces the previous simple binary boolean with physical factors.
 */
const BARANGAY_TERRAIN: Record<string, LocationFactors> = {
  // Lakeshore & River areas (High vulnerability)
  "brgy-napindan": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "poor",
  },
  "brgy-wawa": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "poor",
  },
  "brgy-hagonoy": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "fair",
  },
  "brgy-ususan": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "fair",
  },
  "brgy-bagumbayan": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "poor",
  },
  "brgy-lower-bicutan": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "fair",
  },
  "brgy-ibayo-tipas": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "poor",
  },
  "brgy-palingon-tipas": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "poor",
  },
  "brgy-ligid-tipas": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "poor",
  },
  "brgy-santa-ana": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "fair",
  },
  "brgy-bambang": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "fair",
  },
  "brgy-tuktukan": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "fair",
  },
  "brgy-calzada": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "poor",
  },
  "brgy-new-lower-bicutan": {
    elevation: "low",
    waterwayProximity: true,
    drainageQuality: "fair",
  },

  // Hilly / Higher elevation areas (Low vulnerability)
  "brgy-fort-bonifacio": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "good",
  },
  "brgy-pinagsama": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "good",
  },
  "brgy-pembo": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "fair",
  },
  "brgy-west-rembo": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "fair",
  },
  "brgy-east-rembo": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "fair",
  },
  "brgy-cembo": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "fair",
  },
  "brgy-south-cembo": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "fair",
  },
  "brgy-pitogo": {
    elevation: "high",
    waterwayProximity: false,
    drainageQuality: "good",
  },

  // Missing barangays default to Moderate vulnerability in the getter
};

function getLocationFactors(barangayId: string): LocationFactors {
  return (
    BARANGAY_TERRAIN[barangayId] || {
      elevation: "moderate",
      waterwayProximity: false,
      drainageQuality: "fair",
    }
  );
}

/**
 * Legacy support for checking if an area is generally flood-prone.
 */
export function isFloodProneArea(barangayId: string): boolean {
  const factors = getLocationFactors(barangayId);
  return factors.elevation === "low" || factors.waterwayProximity;
}

function calculateLocationScore(factors: LocationFactors): number {
  let score = 0;
  // Elevation impacts pooling (0 to 40 pts)
  if (factors.elevation === "low") score += 40;
  else if (factors.elevation === "moderate") score += 15;

  // Waterways overflow easily during continuous rain (40 pts)
  if (factors.waterwayProximity) score += 40;

  // Drainage acts as a multiplier/mitigator (0 to 20 pts)
  if (factors.drainageQuality === "poor") score += 20;
  else if (factors.drainageQuality === "fair") score += 10;

  return Math.min(score, 100);
}

// --- Risk Calculation ---

/**
 * Weights for the multi-factor risk calculation.
 * Accurately models that prolonged rain over vulnerable terrain is highly risky.
 */
const WEIGHTS = {
  precipitation: 0.25, // Current intensity (mm)
  rainDuration: 0.25, // Rain persistence (minutes)
  locationVulnerability: 0.4, // Elevation, drainage, waterways
  precipitationChance: 0.1, // Future forecast probability
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

function normalizePrecipitation(mm: number): number {
  return Math.min((mm / 25) * 100, 100); // 25mm/hr is intense
}

function normalizeDuration(minutes: number): number {
  // 180 minutes (3 hours) of continuous rain caps the duration risk factor
  return Math.min((minutes / 180) * 100, 100);
}

/**
 * Computes a flood risk estimate based on multiple local and environmental factors.
 */
export function calculateFloodRisk(weather: BarangayWeather): FloodRiskResult {
  const factors = getLocationFactors(weather.id);
  const locationScore = calculateLocationScore(factors);

  const precipScore = normalizePrecipitation(weather.precipitation);
  const durationScore = normalizeDuration(weather.rainDurationMinutes ?? 0);
  const chanceScore = weather.precipitationChance;

  // Weighted sum
  const score = Math.round(
    precipScore * WEIGHTS.precipitation +
      durationScore * WEIGHTS.rainDuration +
      locationScore * WEIGHTS.locationVulnerability +
      chanceScore * WEIGHTS.precipitationChance,
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

  // Build descriptive string
  const description = buildRiskDescription(level, weather, factors);

  return { level, description, score };
}

/**
 * Generates a human-readable description incorporating the specific local factors.
 */
function buildRiskDescription(
  level: FloodRiskLevel,
  weather: BarangayWeather,
  factors: LocationFactors,
): string {
  const duration = weather.rainDurationMinutes ?? 0;
  let rainStmt = "";

  if (weather.precipitation >= 15) rainStmt = "Heavy rain";
  else if (weather.precipitation >= 5) rainStmt = "Moderate rain";
  else if (duration > 0) rainStmt = "Light rain";
  else if (weather.precipitationChance >= 50) rainStmt = "Expected rain";
  else rainStmt = "No significant rain";

  if (duration >= 60) {
    const hrs = Math.round(duration / 60);
    rainStmt += ` (duration: ~${hrs}h)`;
  } else if (duration > 0) {
    rainStmt += ` (duration: ~${duration}m)`;
  }

  const locFactors = [];
  if (factors.elevation === "low") locFactors.push("low elevation");
  if (factors.waterwayProximity) locFactors.push("near waterways");
  if (factors.drainageQuality === "poor") locFactors.push("poor drainage");

  const locStmt =
    locFactors.length > 0
      ? `Vulnerabilities: ${locFactors.join(", ")}.`
      : "Standard terrain risk.";

  switch (level) {
    case "high":
      return `High Risk: ${rainStmt}. ${locStmt} Immediate flooding possible.`;
    case "elevated":
      return `Elevated Risk: ${rainStmt}. ${locStmt} Monitor low-lying areas.`;
    case "moderate":
      return `Moderate Risk: ${rainStmt}. ${locStmt} Water ponding possible.`;
    case "low":
      return `Low Risk: ${rainStmt}. ${locStmt}`;
  }
}

/**
 * Returns display configuration for a flood risk level.
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
        dotColor: "bg-red-600",
        borderColor: "border-red-200",
      };
    case "elevated":
      return {
        label: "Elevated",
        bgColor: "bg-orange-100",
        textColor: "text-orange-800",
        dotColor: "bg-orange-600",
        borderColor: "border-orange-300",
      };
    case "moderate":
      return {
        label: "Moderate",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        dotColor: "bg-yellow-500",
        borderColor: "border-yellow-300",
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
