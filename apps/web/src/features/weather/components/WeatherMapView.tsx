"use client";

/**
 * WeatherMapView — Interactive map of Taguig barangays with weather/flood risk overlay.
 *
 * This component renders a Leaflet map with GeoJSON polygon boundaries for all
 * 38 Taguig City barangays. Polygons are colored by either weather severity or
 * flood risk tier, reusing the same color tokens and logic from the existing
 * card/list view.
 *
 * TODO: BACKEND — This component pulls weather data from the same shared data
 * source (passed via props from WeatherPageView) that the list view uses.
 * When wiring to a real API, ensure both views use the same hook/data source
 * so they always stay in sync.
 */

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from "react-leaflet";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { BarangayWeather } from "../types/weather.types";
import {
  calculateFloodRisk,
  getFloodRiskConfig,
  type FloodRiskLevel,
} from "../utils/flood-risk";
import WeatherCard from "./WeatherCard";

// --- Types ---

type MapColorMode = "severity" | "flood_risk";

interface WeatherMapViewProps {
  /** Shared weather data — same source as list view */
  weatherData: BarangayWeather[];
  /** Current search query from parent toolbar */
  searchQuery: string;
}

// --- Constants ---

/** Center of Taguig City (approximate) */
const TAGUIG_CENTER: L.LatLngExpression = [14.5176, 121.0509];
const DEFAULT_ZOOM = 13;

// --- GeoJSON Name → Mock Data Name Mapping ---

/**
 * Maps GeoJSON `properties.name` to mock data `name` where they differ.
 *
 * TODO: BACKEND — These mismatches need to be reconciled with the real API's
 * naming convention. The GeoJSON uses official barangay names while the mock
 * data may use colloquial or hyphenated forms. When wiring to a live source,
 * ensure a single canonical name mapping is maintained server-side.
 */
const GEOJSON_TO_DATA_NAME: Record<string, string> = {
  // GeoJSON has "Palingon", mock data has "Palingon-Tipas"
  Palingon: "Palingon-Tipas",
};

// --- Severity Color Helpers ---

/**
 * Returns polygon fill color based on weather severity.
 * Reuses the same Severe (red) / Advisory (yellow) / Normal (default) color
 * scheme from the existing WeatherCard badges.
 */
function getSeverityFillColor(weather: BarangayWeather | undefined): string {
  if (!weather) return "#e5e7eb"; // gray-200 — no data
  switch (weather.severity) {
    case "severe":
      return "#ef4444"; // danger / red-500 — matches bg-danger
    case "warning":
    case "advisory":
      return "#f59e0b"; // warning / amber-500 — matches bg-warning
    default:
      return "#10b981"; // emerald-500 — normal/safe
  }
}

/**
 * Returns polygon fill color based on flood risk tier.
 * Reuses the exact same tier colors from getFloodRiskConfig() in flood-risk.ts.
 */
function getFloodRiskFillColor(level: FloodRiskLevel): string {
  switch (level) {
    case "high":
      return "#ef4444"; // red-500
    case "elevated":
      return "#f97316"; // orange-500
    case "moderate":
      return "#f59e0b"; // amber-500
    case "low":
      return "#10b981"; // emerald-500
  }
}

// --- Condition Icon Emoji (for tooltip) ---

const CONDITION_EMOJI: Record<string, string> = {
  sunny: "☀️",
  partly_cloudy: "⛅",
  cloudy: "☁️",
  overcast: "🌥️",
  light_rain: "🌧️",
  heavy_rain: "🌧️",
  thunderstorm: "⛈️",
};

// --- Sub-components ---

function MapResizer({ isFullScreen }: { isFullScreen?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(map.getContainer());
    return () => resizeObserver.disconnect();
  }, [map]);

  // Extra safety fallback to ensure tiles render properly after a full-screen transition
  useEffect(() => {
    if (typeof isFullScreen !== "undefined") {
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [map, isFullScreen]);

  return null;
}

// --- Sub-component: Map Updater (handles search → pan/zoom) ---

function MapSearchHandler({
  searchQuery,
  geoJsonData,
  weatherDataByName,
}: {
  searchQuery: string;
  geoJsonData: GeoJSON.FeatureCollection | null;
  weatherDataByName: Map<string, BarangayWeather>;
}) {
  const map = useMap();
  const highlightLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    // Clear previous highlight
    if (highlightLayerRef.current) {
      map.removeLayer(highlightLayerRef.current);
      highlightLayerRef.current = null;
    }

    if (!searchQuery.trim() || !geoJsonData) return;

    const normalizedQuery = searchQuery.toLowerCase().trim();

    // Find matching feature
    const matchingFeature = geoJsonData.features.find((feature) => {
      const geoName = feature.properties?.name || "";
      const dataName = GEOJSON_TO_DATA_NAME[geoName] || geoName;
      return (
        geoName.toLowerCase().includes(normalizedQuery) ||
        dataName.toLowerCase().includes(normalizedQuery)
      );
    });

    if (matchingFeature) {
      // Create a highlight layer for the matched barangay
      const highlightLayer = L.geoJSON(matchingFeature as GeoJSON.Feature, {
        style: {
          color: "#2563eb", // blue-600 — distinct highlight border
          weight: 4,
          fillOpacity: 0.15,
          fillColor: "#3b82f6",
          dashArray: "",
        },
      });

      highlightLayer.addTo(map);
      highlightLayerRef.current = highlightLayer;

      // Pan/zoom to the matching barangay
      const bounds = highlightLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }

    return () => {
      if (highlightLayerRef.current) {
        map.removeLayer(highlightLayerRef.current);
        highlightLayerRef.current = null;
      }
    };
  }, [searchQuery, geoJsonData, map, weatherDataByName]);

  return null;
}

// --- Main Component ---

export default function WeatherMapView({
  weatherData,
  searchQuery,
}: WeatherMapViewProps) {
  const [geoJsonData, setGeoJsonData] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [geoJsonLoading, setGeoJsonLoading] = useState(true);
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<MapColorMode>("severity");
  const [selectedBarangay, setSelectedBarangay] =
    useState<BarangayWeather | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(document.fullscreenElement === mapContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  // --- Build lookup: barangay name → weather data ---
  // TODO: BACKEND — This lookup matches GeoJSON feature names to weather data.
  // Both views (list + map) pull from the same weatherData prop, keeping them in sync.
  const weatherDataByName = useMemo(() => {
    const map = new Map<string, BarangayWeather>();
    for (const w of weatherData) {
      map.set(w.name.toLowerCase(), w);
    }
    return map;
  }, [weatherData]);

  /**
   * Resolves a GeoJSON feature name to the matching BarangayWeather entry.
   * Handles known name mismatches via GEOJSON_TO_DATA_NAME mapping.
   */
  const findWeatherForFeature = useCallback(
    (featureName: string): BarangayWeather | undefined => {
      const mappedName = GEOJSON_TO_DATA_NAME[featureName] || featureName;
      return weatherDataByName.get(mappedName.toLowerCase());
    },
    [weatherDataByName],
  );

  // --- Load GeoJSON ---
  useEffect(() => {
    let cancelled = false;

    async function loadGeoJson() {
      try {
        setGeoJsonLoading(true);
        setGeoJsonError(null);

        // TODO: BACKEND — When wired to a real source, the GeoJSON could come
        // from an API endpoint instead of a static file. Add error handling
        // for network failures and stale cache scenarios.
        const response = await fetch("/geojsons/taguig-barangays.geojson");

        if (!response.ok) {
          throw new Error(`Failed to load map data (HTTP ${response.status})`);
        }

        const data: GeoJSON.FeatureCollection = await response.json();

        if (!cancelled) {
          setGeoJsonData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setGeoJsonError(
            err instanceof Error
              ? err.message
              : "Failed to load barangay boundaries.",
          );
        }
      } finally {
        if (!cancelled) {
          setGeoJsonLoading(false);
        }
      }
    }

    loadGeoJson();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- GeoJSON Style Function ---
  const getFeatureStyle = useCallback(
    (feature: GeoJSON.Feature | undefined): L.PathOptions => {
      if (!feature?.properties?.name) {
        return {
          fillColor: "#e5e7eb",
          weight: 1.5,
          color: "#9ca3af",
          fillOpacity: 0.4,
        };
      }

      const featureName: string = feature.properties.name;
      const weather = findWeatherForFeature(featureName);

      let fillColor: string;

      if (colorMode === "flood_risk") {
        // TODO: BACKEND — Flood risk data comes from the same shared weather
        // data source via calculateFloodRisk(). When real API data is available,
        // ensure the flood risk calculation uses live precipitation data.
        if (weather) {
          const risk = calculateFloodRisk(weather);
          fillColor = getFloodRiskFillColor(risk.level);
        } else {
          fillColor = "#e5e7eb"; // no data
        }
      } else {
        fillColor = getSeverityFillColor(weather);
      }

      return {
        fillColor,
        weight: 1.5,
        color: "#6b7280", // gray-500 border
        fillOpacity: 0.55,
        dashArray: "",
      };
    },
    [colorMode, findWeatherForFeature],
  );

  // --- Feature Interaction Handlers ---
  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      if (!feature.properties?.name) return;

      const featureName: string = feature.properties.name;
      const weather = findWeatherForFeature(featureName);

      // --- Hover Tooltip ---
      if (weather) {
        const emoji = CONDITION_EMOJI[weather.condition] || "🌤️";
        const tooltipContent = `
          <div style="font-family: Inter, sans-serif; min-width: 140px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
              ${featureName}
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              ${emoji} ${weather.temperature}°C · ${weather.condition.replace(/_/g, " ")}
            </div>
          </div>
        `;

        (layer as L.Path).bindTooltip(tooltipContent, {
          sticky: true,
          direction: "top",
          offset: [0, -10],
          className: "weather-map-tooltip",
        });
      } else {
        (layer as L.Path).bindTooltip(
          `<div style="font-family: Inter, sans-serif;">
            <div style="font-weight: 600; font-size: 13px;">${featureName}</div>
            <div style="font-size: 12px; color: #9ca3af;">No weather data</div>
          </div>`,
          {
            sticky: true,
            direction: "top",
            offset: [0, -10],
            className: "weather-map-tooltip",
          },
        );
      }

      // --- Hover Highlight ---
      const pathLayer = layer as L.Path;

      pathLayer.on({
        mouseover: () => {
          pathLayer.setStyle({
            weight: 3,
            color: "#1d4ed8", // blue-700
            fillOpacity: 0.7,
          });
          pathLayer.bringToFront();
        },
        mouseout: () => {
          // Reset to original style
          if (geoJsonLayerRef.current) {
            geoJsonLayerRef.current.resetStyle(pathLayer);
          }
        },
        click: () => {
          if (weather) {
            setSelectedBarangay(weather);
          }
        },
      });
    },
    [findWeatherForFeature],
  );

  // --- Legend Data ---
  const legendItems = useMemo(() => {
    if (colorMode === "severity") {
      let severe = 0;
      let advisory = 0;
      let normal = 0;
      let noDataCount = 0;

      if (geoJsonData) {
        geoJsonData.features.forEach((feature) => {
          if (!feature.properties?.name) return;
          const w = findWeatherForFeature(feature.properties.name);
          if (w) {
            if (w.severity === "severe") severe++;
            else if (w.severity === "warning" || w.severity === "advisory")
              advisory++;
            else normal++;
          } else {
            noDataCount++;
          }
        });
      }

      return [
        { label: `Severe (${severe})`, color: "#ef4444" },
        { label: `Advisory (${advisory})`, color: "#f59e0b" },
        { label: `Normal (${normal})`, color: "#10b981" },
        { label: `No Data (${noDataCount})`, color: "#e5e7eb" },
      ];
    } else {
      let high = 0;
      let elevated = 0;
      let moderate = 0;
      let low = 0;
      let noDataCount = 0;

      if (geoJsonData) {
        geoJsonData.features.forEach((feature) => {
          if (!feature.properties?.name) return;
          const w = findWeatherForFeature(feature.properties.name);
          if (w) {
            const risk = calculateFloodRisk(w);
            if (risk.level === "high") high++;
            else if (risk.level === "elevated") elevated++;
            else if (risk.level === "moderate") moderate++;
            else low++;
          } else {
            noDataCount++;
          }
        });
      }

      return [
        { label: `High (${high})`, color: "#ef4444" },
        { label: `Elevated (${elevated})`, color: "#f97316" },
        { label: `Moderate (${moderate})`, color: "#f59e0b" },
        { label: `Low (${low})`, color: "#10b981" },
        { label: `No Data (${noDataCount})`, color: "#e5e7eb" },
      ];
    }
  }, [colorMode, geoJsonData, findWeatherForFeature]);

  // --- Loading State ---
  if (geoJsonLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
          <div className="w-[200px] h-8 bg-gray-200 animate-pulse rounded-md"></div>
          <div className="w-[300px] h-4 bg-gray-200 animate-pulse rounded-md"></div>
        </div>
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 rounded-xl bg-gray-200 animate-pulse border border-gray-100 min-h-[600px] h-[70vh]"></div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  // TODO: BACKEND — Ready for real error handling once wired to a live source.
  // Currently handles static file load failures; will need retry logic and
  // user-friendly messaging for API failures.
  if (geoJsonError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="body-medium text-gray-900 font-medium">
              Map data unavailable
            </p>
            <p className="body-small text-gray-500 mt-1">{geoJsonError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Color Mode Toggle */}
      <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
        <div className="inline-flex p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setColorMode("severity")}
            className={`px-3 py-1.5 rounded-md body-xsmall font-medium transition-all duration-200 ${
              colorMode === "severity"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            Weather Severity
          </button>
          <button
            onClick={() => setColorMode("flood_risk")}
            className={`px-3 py-1.5 rounded-md body-xsmall font-medium transition-all duration-200 ${
              colorMode === "flood_risk"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            Flood Risk
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm border border-gray-300"
                style={{ backgroundColor: item.color }}
              />
              <span className="body-xsmall text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Detail Panel Container */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className={`mb-10 flex-1 overflow-hidden border border-gray-200 shadow-sm relative z-0 ${
            selectedBarangay && !isFullScreen ? "hidden lg:block" : ""
          } rounded-xl bg-white min-h-[600px] ${!isFullScreen ? "h-[70vh]" : ""}`}
        >
          <button
            onClick={toggleFullScreen}
            className="absolute top-4 right-4 z-[1000] bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? (
              <FiMinimize className="w-5 h-5" />
            ) : (
              <FiMaximize className="w-5 h-5" />
            )}
          </button>

          <MapContainer
            center={TAGUIG_CENTER}
            zoom={DEFAULT_ZOOM}
            className="w-full h-full z-0 absolute inset-0"
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <MapResizer isFullScreen={isFullScreen} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-map-tiles"
            />

            {geoJsonData && (
              <GeoJSON
                key={colorMode} // Force re-render when color mode changes
                data={geoJsonData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
                ref={(layer) => {
                  geoJsonLayerRef.current = layer;
                }}
              />
            )}

            {/* Search-driven pan/zoom handler */}
            <MapSearchHandler
              searchQuery={searchQuery}
              geoJsonData={geoJsonData}
              weatherDataByName={weatherDataByName}
            />
          </MapContainer>
        </div>

        {/* Detail Side Panel — shows the WeatherCard for the clicked barangay */}
        {selectedBarangay && !isFullScreen && (
          <div className="w-full lg:w-[360px] shrink-0 flex flex-col min-h-0 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="body-xsmall text-gray-500 font-medium uppercase tracking-wide">
                Barangay Details
              </span>
              <button
                onClick={() => setSelectedBarangay(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-all duration-200"
                aria-label="Close detail panel"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {/* Reuse the existing WeatherCard component — no duplicate UI */}
              <WeatherCard weather={selectedBarangay} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
