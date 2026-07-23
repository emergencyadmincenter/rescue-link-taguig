import type { BarangayWeather } from "../types/weather.types";
import { type ClusterConfig } from "../data/clusters";
import { calculateFloodRisk } from "./flood-risk";

export interface ClusterStats {
  totalBarangays: number;
  severeCount: number;
  advisoryCount: number;
  normalCount: number;
  highFloodRiskCount: number;
  /** True if ANY barangay in the cluster has "high" flood risk */
  isElevatedPriority: boolean;
  /** Average temperature across cluster barangays */
  avgTemperature: number;
}

export function computeClusterStats(
  cluster: ClusterConfig,
  weatherByName: Map<string, BarangayWeather>,
): ClusterStats {
  let severeCount = 0;
  let advisoryCount = 0;
  let normalCount = 0;
  let highFloodRiskCount = 0;
  let totalTemp = 0;
  let matchedCount = 0;

  for (const name of cluster.barangays) {
    const w = weatherByName.get(name.toLowerCase());
    if (!w) continue;

    matchedCount++;
    totalTemp += w.temperature;

    if (w.severity === "severe") severeCount++;
    else if (w.severity === "advisory" || w.severity === "warning")
      advisoryCount++;
    else normalCount++;

    const risk = calculateFloodRisk(w);
    if (risk.level === "high" || risk.level === "elevated")
      highFloodRiskCount++;
  }

  return {
    totalBarangays: cluster.barangays.length,
    severeCount,
    advisoryCount,
    normalCount,
    highFloodRiskCount,
    isElevatedPriority: highFloodRiskCount > 0,
    avgTemperature: matchedCount > 0 ? Math.round(totalTemp / matchedCount) : 0,
  };
}
