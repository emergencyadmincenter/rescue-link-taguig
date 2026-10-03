"use client";

import { useMemo } from "react";
import { FiAlertTriangle, FiMapPin, FiUsers, FiShield } from "react-icons/fi";
import { WiFlood } from "react-icons/wi";
import type { BarangayWeather } from "../types/weather.types";
import { CLUSTERS, type ClusterConfig } from "../data/clusters";
import { computeClusterStats } from "../utils/cluster-stats";

interface ClusterLegendPanelProps {
  weatherData: BarangayWeather[];
  highlightedClusterId: number | null;
  onClusterHover: (clusterId: number | null) => void;
  onClusterClick: (clusterId: number) => void;
  activeTab: "severity" | "flood_risk";
}

export default function ClusterLegendPanel({
  weatherData,
  highlightedClusterId,
  onClusterHover,
  onClusterClick,
  activeTab,
}: ClusterLegendPanelProps) {
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
    <div className="flex flex-col gap-2 p-1">
      {/* Cluster Entries */}
      {clusterStats.map(({ cluster, stats }) => {
        const isHighlighted = highlightedClusterId === cluster.id;

        return (
          <button
            key={cluster.id}
            onMouseEnter={() => onClusterHover(cluster.id)}
            onMouseLeave={() => onClusterHover(null)}
            onClick={() => onClusterClick(cluster.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
              isHighlighted
                ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500/10"
                : "bg-white border-gray-100 hover:border-blue-100/50 hover:bg-blue-50/30"
            }`}
          >
            {/* Cluster Header Row */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <span
                  className={`body-small font-semibold ${
                    isHighlighted ? "text-gray-900" : "text-gray-800"
                  }`}
                >
                  {cluster.label}
                </span>
                <span className="body-xsmall text-gray-500 ml-1.5">
                  • {cluster.area}
                </span>
              </div>
              
            </div>

            {/* Aggregated Stats Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {activeTab === "severity" ? (
                <>
                  {stats.severeCount > 0 && (
                    <span className="body-xsmall font-medium text-red-700">
                      {stats.severeCount} Severe
                    </span>
                  )}
                  {stats.advisoryCount > 0 && (
                    <span className="body-xsmall font-medium text-amber-600">
                      {stats.advisoryCount} Advisory
                    </span>
                  )}
                  {stats.normalCount > 0 && (
                    <span className="body-xsmall text-emerald-600">
                      {stats.normalCount} Normal
                    </span>
                  )}
                </>
              ) : (
                <>
                  
                  {stats.floodHighCount > 0 && (
                    <span className="body-xsmall font-medium text-red-700">
                      {stats.floodHighCount} High
                    </span>
                  )}
                  {stats.floodElevatedCount > 0 && (
                    <span className="body-xsmall font-medium text-orange-500">
                      {stats.floodElevatedCount} Elevated
                    </span>
                  )}
                  {stats.floodModerateCount > 0 && (
                    <span className="body-xsmall font-medium text-yellow-400">
                      {stats.floodModerateCount} Moderate
                    </span>
                  )}
                  {stats.floodLowCount > 0 && (
                    <span className="body-xsmall text-emerald-600">
                      {stats.floodLowCount} Low
                    </span>
                  )}
                </>
              )}
              {/* Barangay Count */}
              <span className="body-xsmall text-gray-400 ml-auto">
                {stats.totalBarangays} brgy
              </span>
            </div>
          </button>
        );
      })}

      {/* Footer Note */}
      <p className="body-xsmall text-gray-400 mt-2 px-1 text-center leading-relaxed">
        Click a cluster to zoom in.
      </p>
    </div>
  );
}
