"use client";

import { useState } from "react";
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiRain,
  WiStormShowers,
  WiCloudyGusts,
  WiRainWind,
  WiFlood,
} from "react-icons/wi";
import { FiAlertTriangle, FiInfo } from "react-icons/fi";
import type { BarangayWeather, WeatherCondition } from "../types/weather.types";
import {
  calculateFloodRisk,
  getFloodRiskConfig,
} from "../utils/flood-risk";

// --- Weather Condition Icon Mapping ---
const WEATHER_ICONS: Record<WeatherCondition, React.ElementType> = {
  sunny: WiDaySunny,
  partly_cloudy: WiDayCloudy,
  cloudy: WiCloudy,
  overcast: WiCloudyGusts,
  light_rain: WiRain,
  heavy_rain: WiRainWind,
  thunderstorm: WiStormShowers,
};

const WEATHER_LABELS: Record<WeatherCondition, string> = {
  sunny: "Sunny",
  partly_cloudy: "Partly Cloudy",
  cloudy: "Cloudy",
  overcast: "Overcast",
  light_rain: "Light Rain",
  heavy_rain: "Heavy Rain",
  thunderstorm: "Thunderstorm",
};

const ICON_COLORS: Record<WeatherCondition, string> = {
  sunny: "text-yellow-500",
  partly_cloudy: "text-yellow-400",
  cloudy: "text-gray-400",
  overcast: "text-gray-500",
  light_rain: "text-blue-400",
  heavy_rain: "text-blue-600",
  thunderstorm: "text-purple-600",
};

// --- Relative Time Helper ---
function getRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  return `${Math.floor(diffHr / 24)}d ago`;
}

interface WeatherCardProps {
  weather: BarangayWeather;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const Icon = WEATHER_ICONS[weather.condition];
  const iconColor = ICON_COLORS[weather.condition];
  const label = WEATHER_LABELS[weather.condition];

  const isSevere = weather.severity === "severe";
  const isAdvisory = weather.severity === "advisory" || weather.severity === "warning";

  // Card border/background based on severity
  const cardStyles = isSevere
    ? "border-danger/40 bg-red-50/30"
    : isAdvisory
      ? "border-warning/40 bg-yellow-50/30"
      : "border-gray-100";

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-gray-200 transition-all duration-200 ease-in-out relative ${cardStyles}`}
    >
      {/* Severity Badge */}
      {(isSevere || isAdvisory) && (
        <div
          className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full body-xsmall font-semibold ${
            isSevere
              ? "bg-danger/10 text-danger"
              : "bg-warning/10 text-warning"
          }`}
        >
          <FiAlertTriangle className="w-3 h-3" />
          {isSevere ? "Severe" : "Advisory"}
        </div>
      )}

      {/* Header: Barangay Name + Condition */}
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
            isSevere
              ? "bg-danger/10"
              : isAdvisory
                ? "bg-warning/10"
                : "bg-gray-50"
          }`}
        >
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`text-gray-900 font-semibold whitespace-nowrap pr-16 ${
              weather.name.length > 22
                ? "text-xs leading-5"
                : weather.name.length > 18
                  ? "text-[13px] leading-5"
                  : "title-small"
            }`}
          >
            {weather.name}
          </h3>
          <p className="body-xsmall text-gray-500">{label}</p>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900 tracking-tight">
          {weather.temperature}°C
        </span>
        <span className="body-xsmall text-gray-400">
          Feels like {weather.feelsLike}°C
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {/* Humidity */}
        <div className="flex flex-col">
          <span className="body-xsmall text-gray-400">Humidity</span>
          <span className="body-small text-gray-700 font-medium">
            {weather.humidity}%
          </span>
        </div>

        {/* Wind */}
        <div className="flex flex-col">
          <span className="body-xsmall text-gray-400">Wind</span>
          <span className="body-small text-gray-700 font-medium">
            {weather.windSpeed} km/h {weather.windDirection}
          </span>
        </div>

        {/* Precipitation Chance */}
        <div className="flex flex-col">
          <span className="body-xsmall text-gray-400">Rain Chance</span>
          <span className="body-small text-gray-700 font-medium">
            {weather.precipitationChance}%
          </span>
        </div>

        {/* Precipitation */}
        <div className="flex flex-col">
          <span className="body-xsmall text-gray-400">Precipitation</span>
          <span className="body-small text-gray-700 font-medium">
            {weather.precipitation} mm
          </span>
        </div>
      </div>

      {/* Flood Risk Estimate Section */}
      <FloodRiskSection weather={weather} />

      {/* Last Updated */}
      <div className="pt-1 border-t border-gray-100">
        <span className="body-xsmall text-gray-400">
          Updated {getRelativeTime(weather.lastUpdated)}
        </span>
      </div>
    </div>
  );
}

// --- Flood Risk Section (sub-component) ---

function FloodRiskSection({ weather }: { weather: BarangayWeather }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const risk = calculateFloodRisk(weather);
  const config = getFloodRiskConfig(risk.level);

  return (
    <div className="border-t-2 border-dashed border-gray-100 pt-3">
      {/* Section Header with Info Tooltip */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          
          <span className="body-xsmall font-semibold text-gray-600 uppercase tracking-wide">
            Flood Risk Estimate
          </span>
        </div>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label="About flood risk estimate"
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <FiInfo className="w-3.5 h-3.5" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 bottom-full mb-2 w-56 px-3 py-2 bg-gray-900 text-white body-xsmall rounded-lg shadow-lg z-10 pointer-events-none">
              <p>
                This is an <strong>estimate</strong> based on current rainfall
                patterns and known flood-prone areas — not a guaranteed
                forecast. Actual conditions may vary.
              </p>
              <div className="absolute bottom-0 right-3 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
            </div>
          )}
        </div>
      </div>

      {/* Risk Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
      >
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.dotColor}`} />
        <div className="min-w-0 flex-1">
          <span className={`body-small font-semibold ${config.textColor}`}>
            {config.label}
          </span>
          <p className="body-xsmall text-gray-500 mt-0.5 leading-snug">
            {risk.description}
          </p>
        </div>
      </div>
    </div>
  );
}
