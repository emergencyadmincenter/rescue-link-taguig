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
}

export default function ClusterDetailPanel({
  cluster,
  barangayWeather,
  weatherByName,
  onBack,
  onBarangaySelect,
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

      {/* Cluster Meta */}
      <div className="flex items-center gap-3 mb-3 px-1 shrink-0">
        <div className="flex items-center gap-1 text-gray-400">
          <FiUsers className="w-3 h-3" />
          <span className="body-xsmall">{cluster.assignedTeam}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <FiMapPin className="w-3 h-3" />
          <span className="body-xsmall">{cluster.commandPost}</span>
        </div>
      </div>

      {/* ── Cluster-Level Summary Stats ── */}
      <div
        className={`rounded-lg border p-3 mb-3 shrink-0 ${cluster.bgClass} ${cluster.borderClass}`}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <FiThermometer className={`w-3.5 h-3.5 ${cluster.textClass}`} />
          <span
            className={`body-xsmall font-semibold ${cluster.textClass} uppercase tracking-wide`}
          >
            Cluster Summary
          </span>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {/* Avg Temperature */}
          <div className="flex flex-col">
            <span className="body-xsmall text-gray-500">Avg Temp</span>
            <span className="body-small font-semibold text-gray-800">
              {stats.avgTemperature}°C
            </span>
          </div>

          {/* Total Barangays */}
          <div className="flex flex-col">
            <span className="body-xsmall text-gray-500">Barangays</span>
            <span className="body-small font-semibold text-gray-800">
              {stats.totalBarangays}
            </span>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="mt-2 pt-2 border-t border-gray-200/50">
          <div className="flex items-center gap-2 flex-wrap body-xsmall font-medium">
            {stats.severeCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <FiAlertTriangle className="w-3 h-3" />
                {stats.severeCount} Severe
              </span>
            )}
            {stats.advisoryCount > 0 && (
              <span className="text-amber-600">
                {stats.advisoryCount} Advisory
              </span>
            )}
            {stats.normalCount > 0 && (
              <span className="text-emerald-600">
                {stats.normalCount} Normal
              </span>
            )}
          </div>
        </div>

        {/* Highest Flood Risk */}
        {highestFloodRisk && highestFloodRiskConfig && (
          <div className="mt-2 pt-2 border-t border-gray-200/50">
            <div className="flex items-center gap-1.5">
              <WiFlood
                className={`w-4 h-4 ${highestFloodRiskConfig.textColor}`}
              />
              <span className="body-xsmall text-gray-500">
                Highest Flood Risk:
              </span>
              <span
                className={`body-xsmall font-semibold ${highestFloodRiskConfig.textColor}`}
              >
                {highestFloodRiskConfig.label}
              </span>
              <span className="body-xsmall text-gray-400">
                ({highestFloodRisk.name})
              </span>
            </div>
          </div>
        )}
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
            className="cursor-pointer transition-transform duration-150 hover:scale-[1.01]"
            onClick={() => onBarangaySelect(w)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onBarangaySelect(w);
            }}
          >
            <CompactWeatherCard weather={w} clusterColor={cluster.color} />
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
