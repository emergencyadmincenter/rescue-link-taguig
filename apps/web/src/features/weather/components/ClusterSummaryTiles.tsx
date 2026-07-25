"use client";

import { useMemo } from "react";
import type { BarangayWeather } from "../types/weather.types";
import { CLUSTERS } from "../data/clusters";
import { computeClusterStats } from "../utils/cluster-stats";

interface ClusterSummaryTilesProps {
  weatherData: BarangayWeather[];
  activeClusterFilter: number | null;
  onClusterSelect: (clusterId: number) => void;
}

export default function ClusterSummaryTiles({
  weatherData,
  activeClusterFilter,
  onClusterSelect,
}: ClusterSummaryTilesProps) {
  // Build weather lookup once
  const weatherByName = useMemo(() => {
    const map = new Map<string, BarangayWeather>();
    for (const w of weatherData) {
      map.set(w.name.toLowerCase(), w);
    }
    return map;
  }, [weatherData]);

  // Compute stats for all clusters
  const clusterStats = useMemo(
    () =>
      CLUSTERS.map((cluster) => ({
        cluster,
        stats: computeClusterStats(cluster, weatherByName),
      })),
    [weatherByName],
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 hide-scrollbar">
      {clusterStats.map(({ cluster, stats }) => {
        const isActive = activeClusterFilter === cluster.id;

        // Build stats array to easily join with dots
        const statItems = [];
        if (stats.severeCount > 0) {
          statItems.push(
            <span key="severe" className="text-red-600">
              {stats.severeCount} Severe
            </span>,
          );
        }
        if (stats.advisoryCount > 0) {
          statItems.push(
            <span key="advisory" className="text-amber-600">
              {stats.advisoryCount} Advisory
            </span>,
          );
        }
        if (stats.highFloodRiskCount > 0) {
          statItems.push(
            <span key="flood" className="text-orange-600">
              {stats.highFloodRiskCount} Flood Risk
            </span>,
          );
        }
        // If we want to show normal when there are no issues, or just always show it if non-zero?
        // The prompt says "only show non-zero counts". Let's show Normal if non-zero, but maybe only if there's no severe/advisory/flood?
        // The prompt says: "Summary stats in compact format: '2 Severe · 3 Advisory · 1 Flood Risk' (only show non-zero counts)"
        // It also mentioned "text-emerald-600 for normal".
        if (stats.normalCount > 0) {
          statItems.push(
            <span key="normal" className="text-emerald-600">
              {stats.normalCount} Normal
            </span>,
          );
        }

        return (
          <button
            key={cluster.id}
            onClick={() => onClusterSelect(cluster.id)}
            className={`flex-1 min-w-[200px] md:min-w-0 text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
              isActive
                ? `${cluster.bgClass} ${cluster.borderClass} shadow-sm`
                : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            {/* Cluster Header */}
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2.5 h-2.5 rounded-sm shrink-0 ${cluster.dotClass}`}
              />
              <span
                className={`body-small font-semibold truncate ${
                  isActive ? cluster.textClass : "text-gray-800"
                }`}
              >
                {cluster.label}
              </span>
            </div>

            {/* Stats */}
            <div className="body-xsmall font-medium flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
              {statItems.length > 0 ? (
                statItems.map((item, index) => (
                  <div key={item.key} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-gray-300">·</span>}
                    {item}
                  </div>
                ))
              ) : (
                <span className="text-gray-400">No data</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
