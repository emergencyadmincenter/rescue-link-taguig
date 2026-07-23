"use client";

/**
 * ClusterLegendPanel — Legend panel for Emergency Command Center cluster view.
 *
 * Displays all 5 clusters with their color, aggregated weather stats,
 * assigned rescue team, and flood risk rollup. Supports interactive
 * hover/click to highlight cluster barangays on the map.
 *
 * Reuses existing design system typography, color tokens, and badge
 * styling patterns from WeatherCard and the flood risk section.
 *
 * // TODO: BACKEND — Cluster stats are currently derived from mock weather
 * // data. When wired to a real backend, cluster-level aggregates could be
 * // pre-computed server-side for faster rendering.
 */

import { useMemo } from "react";
import { FiAlertTriangle, FiMapPin, FiUsers, FiShield } from "react-icons/fi";
import { WiFlood } from "react-icons/wi";
import type { BarangayWeather } from "../types/weather.types";
import { CLUSTERS, type ClusterConfig } from "../data/clusters";
import { calculateFloodRisk } from "../utils/flood-risk";

interface ClusterLegendPanelProps {
  /** Full weather data set (unfiltered) */
  weatherData: BarangayWeather[];
  /** Currently highlighted cluster ID (from legend hover/click) */
  highlightedClusterId: number | null;
  /** Callback when a cluster legend entry is hovered */
  onClusterHover: (clusterId: number | null) => void;
  /** Callback when a cluster legend entry is clicked */
  onClusterClick: (clusterId: number) => void;
}

// --- Cluster Stats ---

import { computeClusterStats } from "../utils/cluster-stats";

// --- Main Component ---

export default function ClusterLegendPanel({
  weatherData,
  highlightedClusterId,
  onClusterHover,
  onClusterClick,
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
    <div className="flex flex-col gap-2">
      {/* Panel Header */}
      <div className="flex items-center gap-2 mb-1">
        <FiShield className="w-4 h-4 text-gray-500" />
        <span className="body-xsmall font-semibold text-gray-600 uppercase tracking-wide">
          Command Center Clusters
        </span>
      </div>

      {/* Cluster Entries */}
      {clusterStats.map(({ cluster, stats }) => {
        const isHighlighted = highlightedClusterId === cluster.id;

        return (
          <button
            key={cluster.id}
            onMouseEnter={() => onClusterHover(cluster.id)}
            onMouseLeave={() => onClusterHover(null)}
            onClick={() => onClusterClick(cluster.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
              isHighlighted
                ? `${cluster.bgClass} ${cluster.borderClass} shadow-sm scale-[1.01]`
                : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            {/* Cluster Header Row */}
            <div className="flex items-center gap-2 mb-1.5">
              {/* Color Dot */}
              <div
                className={`w-3 h-3 rounded-sm shrink-0 ${cluster.dotClass}`}
              />
              {/* Name + Area */}
              <div className="flex-1 min-w-0">
                <span
                  className={`body-small font-semibold ${
                    isHighlighted ? cluster.textClass : "text-gray-800"
                  }`}
                >
                  {cluster.label}
                </span>
                <span className="body-xsmall text-gray-400 ml-1.5">
                  · {cluster.area}
                </span>
              </div>
              {/* Elevated Priority Flag */}
              {stats.isElevatedPriority && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 border border-red-200">
                  <FiAlertTriangle className="w-2.5 h-2.5 text-red-600" />
                  <span className="body-xsmall font-semibold text-red-600">
                    Priority
                  </span>
                </div>
              )}
            </div>

            {/* Aggregated Stats Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Severity Counts */}
              {stats.severeCount > 0 && (
                <span className="body-xsmall font-medium text-red-600">
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
              {stats.highFloodRiskCount > 0 && (
                <span className="flex items-center gap-0.5 body-xsmall text-orange-600">
                  <WiFlood className="w-3.5 h-3.5" />
                  {stats.highFloodRiskCount} Flood Risk
                </span>
              )}
              {/* Barangay Count */}
              <span className="body-xsmall text-gray-400 ml-auto">
                {stats.totalBarangays} barangays
              </span>
            </div>

            {/* Response Assignment (Mock) */}
            {/* // TODO: BACKEND — Replace with real team assignment data */}
            <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-gray-100/80">
              <div className="flex items-center gap-1 text-gray-400">
                <FiUsers className="w-3 h-3" />
                <span className="body-xsmall">{cluster.assignedTeam}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <FiMapPin className="w-3 h-3" />
                <span className="body-xsmall">{cluster.commandPost}</span>
              </div>
            </div>
          </button>
        );
      })}

      {/* Footer Note */}
      <p className="body-xsmall text-gray-400 mt-1 px-1 leading-relaxed">
        Click a cluster to zoom in. Hover to highlight on map.
      </p>
    </div>
  );
}
