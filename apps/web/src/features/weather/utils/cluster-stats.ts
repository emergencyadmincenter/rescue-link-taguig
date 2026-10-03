import type { BarangayWeather } from "../types/weather.types";
import { type ClusterConfig } from "../data/clusters";
import { calculateFloodRisk } from "./flood-risk";

export interface ClusterStats {
  totalBarangays: number;
  severeCount: number;
  advisoryCount: number;
  normalCount: number;

  floodLowCount: number;
  floodModerateCount: number;
  floodElevatedCount: number;
  floodHighCount: number;
  

  highFloodRiskCount: number;
  isElevatedPriority: boolean;
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

  let floodLowCount = 0;
  let floodModerateCount = 0;
  let floodElevatedCount = 0;
  let floodHighCount = 0;
  

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
      if (risk.level === "low") floodLowCount++;
      else if (risk.level === "moderate") floodModerateCount++;
      else if (risk.level === "elevated") floodElevatedCount++;
      else if (risk.level === "high") floodHighCount++;
      

    if (
      risk.level === "high" ||
      risk.level === "elevated" 
    )
      highFloodRiskCount++;
  }

  return {
    totalBarangays: cluster.barangays.length,
    severeCount,
    advisoryCount,
    normalCount,
    floodLowCount,
    floodModerateCount,
    floodElevatedCount,
    floodHighCount,
    
    highFloodRiskCount,
    isElevatedPriority: highFloodRiskCount > 0 || severeCount > 0,
    avgTemperature: matchedCount > 0 ? Math.round(totalTemp / matchedCount) : 0,
  };
}
