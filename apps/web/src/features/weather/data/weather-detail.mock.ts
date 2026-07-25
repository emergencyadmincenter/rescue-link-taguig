/**
 * Mock data generators for Barangay Detail Panel — Trend and History tabs.
 *
 * These functions derive all data from the existing BarangayWeather snapshot.
 * They use deterministic hashing so the same barangay always produces the
 * same trend/history data across renders.
 *
 * // TODO: BACKEND - Both generators produce synthetic data extrapolated
 * // from a single weather snapshot. They are placeholders for real
 * // time-series and event log endpoints. See per-function TODOs below.
 */

import type { BarangayWeather } from "../types/weather.types";

// --- Types ---

export interface HourlyDataPoint {
  /** Display label for X-axis, e.g. "14:00" */
  time: string;
  /** Hour of day (0-23) */
  hour: number;
  /** Temperature in °C */
  temperature: number;
  /** Precipitation in mm */
  precipitation: number;
}

export interface HistoryEntry {
  /** Unique entry ID */
  id: string;
  /** ISO timestamp */
  timestamp: string;
  /** Human-readable time, e.g. "6:42 PM" */
  displayTime: string;
  /** Event description */
  message: string;
  /** Event type for visual styling */
  type: "upgrade" | "downgrade" | "info";
}

// --- Deterministic Hash ---

/**
 * Simple string-to-number hash for deterministic per-barangay variation.
 * Same approach as weather.mock.ts.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Deterministic seeded pseudo-random for index-specific variation.
 * Returns a value between 0 and 1.
 */
function seededRandom(seed: string, index: number): number {
  return hashString(`${seed}_${index}`);
}

// --- Hourly Trend Generator ---

/**
 * Generates mock 24-hour time-series for temperature and precipitation.
 * Uses the barangay's current weather snapshot as a baseline and applies
 * deterministic day/night temperature variation and precipitation patterns.
 *
 * // TODO: BACKEND - This generates synthetic hourly data derived from the
 * // current snapshot. A real implementation needs a time-series weather
 * // endpoint (e.g. Open-Meteo hourly history or GET /api/weather/:id/hourly)
 * // that returns actual historical readings per barangay, not extrapolations
 * // from a single current value.
 */
export function generateHourlyTrend(
  weather: BarangayWeather,
): HourlyDataPoint[] {
  const points: HourlyDataPoint[] = [];
  const baseTemp = weather.temperature;
  const basePrecip = weather.precipitation;
  const seed = weather.name;

  const now = new Date();
  const currentHour = now.getHours();

  for (let i = 23; i >= 0; i--) {
    const dataHour = (currentHour - i + 24) % 24;

    // Sinusoidal day/night cycle: peak at ~14:00, trough at ~04:00
    // Range: +/- 3°C around base temperature
    const hourAngle = ((dataHour - 14) / 24) * 2 * Math.PI;
    const dayNightVariation = -Math.cos(hourAngle) * 3;

    // Per-barangay offset so different barangays don't have identical curves
    const barangayOffset = (seededRandom(seed, 100) - 0.5) * 2;

    // Small per-hour noise
    const hourNoise = (seededRandom(seed + "temp", i) - 0.5) * 1.5;

    const temperature =
      Math.round((baseTemp + dayNightVariation + barangayOffset + hourNoise) * 10) / 10;

    // Precipitation: for severe/advisory, show rising trend in recent hours
    let precipValue = 0;
    const isSevereOrAdvisory =
      weather.severity === "severe" || weather.severity === "advisory";

    if (basePrecip > 0 || isSevereOrAdvisory) {
      // Base precipitation with per-hour variation
      const precipBase = basePrecip > 0 ? basePrecip : 0;
      const precipNoise = seededRandom(seed + "precip", i) * precipBase * 0.4;

      if (isSevereOrAdvisory && i < 8) {
        // Rising trend in last 8 hours for severe/advisory barangays
        const rampFactor = (8 - i) / 8;
        precipValue = precipBase * 0.3 + precipBase * rampFactor * 0.7 + precipNoise;
      } else if (basePrecip > 0) {
        // Scattered precipitation for normal rain
        const hasRain = seededRandom(seed + "rain", i) > 0.4;
        precipValue = hasRain ? precipBase * 0.5 + precipNoise : 0;
      }
    }

    points.push({
      time: `${dataHour.toString().padStart(2, "0")}:00`,
      hour: dataHour,
      temperature,
      precipitation: Math.max(0, Math.round(precipValue * 10) / 10),
    });
  }

  return points;
}

// --- History Event Log Generator ---

/**
 * Generates mock status-change events for the History tab.
 * Returns 4-6 reverse-chronological entries with varied timestamps
 * and status-change text appropriate to the barangay's current severity.
 *
 * // TODO: BACKEND - This generates synthetic event history from static
 * // weather data. A real implementation needs a backend event log service
 * // (e.g. GET /api/weather/:id/events) that records actual status
 * // transitions as they happen. The current mock data cannot represent
 * // real transitions because it only has a single snapshot, not a
 * // history of changes.
 */
export function generateHistoryLog(
  weather: BarangayWeather,
): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const h = hashString(weather.name);
  const now = new Date();

  // 4-6 entries per barangay, determined by name hash
  const count = 4 + Math.floor(h * 3);

  // Message pools by severity level
  const severeMsgs: { msg: string; type: HistoryEntry["type"] }[] = [
    { msg: "Upgraded to Severe", type: "upgrade" },
    { msg: `Rain chance rose to ${weather.precipitationChance}%`, type: "info" },
    { msg: `Wind speed exceeded ${weather.windSpeed} km/h`, type: "info" },
    { msg: "Heavy rainfall warning issued", type: "upgrade" },
    { msg: "Upgraded from Advisory to Severe", type: "upgrade" },
    { msg: "Flood risk elevated to High", type: "info" },
  ];

  const advisoryMsgs: { msg: string; type: HistoryEntry["type"] }[] = [
    { msg: "Upgraded to Advisory", type: "upgrade" },
    { msg: "Precipitation increasing steadily", type: "info" },
    { msg: "Downgraded from Severe to Advisory", type: "downgrade" },
    { msg: `Wind speed reached ${weather.windSpeed} km/h`, type: "info" },
    { msg: "Moderate rain warning issued", type: "upgrade" },
    { msg: `Rain chance rose to ${weather.precipitationChance}%`, type: "info" },
  ];

  const normalMsgs: { msg: string; type: HistoryEntry["type"] }[] = [
    { msg: "Conditions stable", type: "info" },
    { msg: "Wind speed decreased to normal", type: "downgrade" },
    { msg: `Temperature at ${weather.temperature}°C`, type: "info" },
    { msg: "Clear skies reported", type: "info" },
    { msg: "Downgraded from Advisory to Normal", type: "downgrade" },
    { msg: "Humidity levels returned to normal", type: "info" },
  ];

  const msgPool =
    weather.severity === "severe"
      ? severeMsgs
      : weather.severity === "advisory" || weather.severity === "warning"
        ? advisoryMsgs
        : normalMsgs;

  let cumulativeMinutes = 0;

  for (let i = 0; i < count; i++) {
    // Spread timestamps across last 12 hours with deterministic intervals
    const intervalMinutes = 30 + Math.floor(seededRandom(weather.name + "time", i) * 150);
    cumulativeMinutes += intervalMinutes;

    const entryDate = new Date(now.getTime() - cumulativeMinutes * 60 * 1000);

    // Pick message: first entry for severe/advisory is always the status upgrade
    let msgEntry: { msg: string; type: HistoryEntry["type"] };
    if (i === 0 && weather.severity === "severe") {
      msgEntry = severeMsgs[0]; // "Upgraded to Severe"
    } else if (i === 0 && (weather.severity === "advisory" || weather.severity === "warning")) {
      msgEntry = advisoryMsgs[0]; // "Upgraded to Advisory"
    } else {
      // Deterministic selection from pool, skipping first entry after i===0
      const poolIndex = Math.floor(seededRandom(weather.name, i) * (msgPool.length - 1)) + 1;
      msgEntry = msgPool[poolIndex % msgPool.length];
    }

    entries.push({
      id: `${weather.id}-evt-${i}`,
      timestamp: entryDate.toISOString(),
      displayTime: entryDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      message: msgEntry.msg,
      type: msgEntry.type,
    });
  }

  return entries;
}
