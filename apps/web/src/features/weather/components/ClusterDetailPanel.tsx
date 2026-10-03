"use client";

/**
 * ClusterDetailPanel — Consolidated cluster weather summary + per-barangay breakdown.
 *
 * Shown when a user clicks a cluster (from the map legend or cluster filter).
 * Displays:
 *   1. Cluster-level summary stats (avg temp, severity counts, highest flood risk)
 *   2. Full per-barangay breakdown using the existing WeatherCard component
 *
 * This replaces the previous "names only" cluster list that required clicking
 * each barangay individually to see weather data.
 */

import { useMemo } from "react";
import {
  FiArrowLeft,
  FiUsers,
  FiMapPin,
  FiThermometer,
  FiAlertTriangle,
} from "react-icons/fi";
import { WiFlood } from "react-icons/wi";
import type { BarangayWeather } from "../types/weather.types";
import { type ClusterConfig } from "../data/clusters";
import { computeClusterStats } from "../utils/cluster-stats";
import { calculateFloodRisk, getFloodRiskConfig } from "../utils/flood-risk";
import WeatherCard, { CompactWeatherCard } from "./WeatherCard";

interface ClusterDetailPanelProps {
  /** The cluster configuration to display */
  cluster: ClusterConfig;
  /** Sorted weather data for all barangays in this cluster */
  barangayWeather: BarangayWeather[];
  /** Weather data lookup map (name lowercase → BarangayWeather) */
  weatherByName: Map<string, BarangayWeather>;
  /** Called when the user clicks the back button */
  onBack: () => void;
  /** Called when the user clicks a specific barangay card to see its full detail */
  onBarangaySelect: (weather: BarangayWeather) => void;
  /** Active tab to pass down to compact card */
  activeTab?: "severity" | "flood_risk";
}

export default function ClusterDetailPanel({
  cluster,
  barangayWeather,
  weatherByName,
  onBack,
  onBarangaySelect,
  activeTab = "flood_risk",
}: ClusterDetailPanelProps) {
  // Compute cluster-level summary stats
  const stats = useMemo(
    () => computeClusterStats(cluster, weatherByName),
    [cluster, weatherByName],
  );

  // Find the highest flood risk barangay
  const highestFloodRisk = useMemo(() => {
    let worst: { name: string; level: string; score: number } | null = null;
    for (const w of barangayWeather) {
      const risk = calculateFloodRisk(w);
      if (!worst || risk.score > worst.score) {
        worst = { name: w.name, level: risk.level, score: risk.score };
      }
    }
    return worst;
  }, [barangayWeather]);

  const highestFloodRiskConfig = highestFloodRisk
    ? getFloodRiskConfig(highestFloodRisk.level as any)
    : null;

  // Build severity summary label
  const severitySummaryParts: string[] = [];
  if (stats.severeCount > 0)
    severitySummaryParts.push(`${stats.severeCount} Severe`);
  if (stats.advisoryCount > 0)
    severitySummaryParts.push(`${stats.advisoryCount} Advisory`);
  if (stats.normalCount > 0)
    severitySummaryParts.push(`${stats.normalCount} Normal`);

  return (
    <div className="flex flex-col min-h-0 animate-fade-in h-full">
      {/* Header: Back + Cluster Identity */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-all duration-200"
          aria-label="Back to cluster legend"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div className={`w-3 h-3 rounded-sm ${cluster.dotClass}`} />
        <span className={`body-small font-semibold ${cluster.textClass}`}>
          {cluster.label}
        </span>
        <span className="body-xsmall text-gray-400">· {cluster.area}</span>
      </div>

      {/* ── Per-Barangay Breakdown ── */}
      <div className="border-t border-gray-100 pt-2 mb-2 shrink-0">
        <span className="body-xsmall text-gray-500 font-medium uppercase tracking-wide">
          Barangays ({barangayWeather.length})
        </span>
      </div>

      <div className="overflow-y-auto custom-scrollbar h-[350px] lg:h-[420px] flex flex-col gap-2.5 pb-4 pr-1">
        {barangayWeather.map((w) => (
          <div
            key={w.id}
            className="cursor-pointer transition-all duration-200 hover:scale-[1.01] rounded-lg hover:shadow-sm hover:ring-2 hover:ring-blue-500/20"
            onClick={() => onBarangaySelect(w)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onBarangaySelect(w);
            }}
          >
            <CompactWeatherCard
              weather={w}
              clusterColor={cluster.color}
              activeTab={activeTab}
            />
          </div>
        ))}
        {barangayWeather.length === 0 && (
          <p className="body-xsmall text-gray-400 py-4 text-center">
            No weather data available for this cluster.
          </p>
        )}
      </div>
    </div>
  );
}
