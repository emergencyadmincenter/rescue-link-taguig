"use client";

/**
 * WeatherMapView — Interactive map of Taguig barangays with weather/flood risk/cluster overlay.
 *
 * This component renders a Leaflet map with GeoJSON polygon boundaries for all
 * 38 Taguig City barangays. Polygons are colored by either weather severity,
 * flood risk tier, or Emergency Command Center cluster assignment, reusing the
 * same color tokens and logic from the existing card/list view.
 *
 * TODO: BACKEND — This component pulls weather data from the same shared data
 * source (passed via props from WeatherPageView) that the list view uses.
 * When wiring to a real API, ensure both views use the same hook/data source
 * so they always stay in sync.
 */

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { BarangayWeather } from "../types/weather.types";
import {
  calculateFloodRisk,
  getFloodRiskConfig,
  type FloodRiskLevel,
} from "../utils/flood-risk";
import {
  CLUSTERS,
  getClusterForBarangay,
  type ClusterConfig,
} from "../data/clusters";
import WeatherCard from "./WeatherCard";
import ClusterLegendPanel from "./ClusterLegendPanel";
import { BarangayDetailPanel } from "./BarangayDetailPanel";
import ClusterDetailPanel from "./ClusterDetailPanel";

// --- Types ---

export type MapColorMode = "severity" | "flood_risk" | "cluster";

interface WeatherMapViewProps {
  /** Shared weather data -- same source as list view */
  weatherData: BarangayWeather[];
  /** Current search query from parent toolbar */
  searchQuery: string;
  /** Active cluster filter from parent (null = no filter) */
  activeClusterFilter: number | null;
  /** Callback to select/clear active cluster filter */
  onClusterSelect: (clusterId: number | null) => void;
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

// --- Condition Labels (for tooltip) ---

const CONDITION_LABELS: Record<string, string> = {
  sunny: "Sunny",
  partly_cloudy: "Partly Cloudy",
  cloudy: "Cloudy",
  overcast: "Overcast",
  light_rain: "Light Rain",
  heavy_rain: "Heavy Rain",
  thunderstorm: "Thunderstorm",
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

// --- Sub-component: Cluster Boundary Outlines ---

/**
 * Renders thicker outlines around each cluster's combined barangay group
 * so the 5 cluster boundaries are visually obvious beyond individual
 * barangay borders.
 *
 * Uses a distinct border-color per cluster with increased weight.
 * A true merged polygon (union) would require Turf.js — this approach
 * draws each barangay in a cluster with the cluster's thick border color,
 * which visually groups them without the Turf dependency.
 *
 * // TODO: Consider using @turf/union to merge each cluster's polygons
 * // into a single outline for cleaner visual boundaries.
 */
function ClusterBoundaryOutlines({
  geoJsonData,
  highlightedClusterId,
}: {
  geoJsonData: GeoJSON.FeatureCollection;
  highlightedClusterId: number | null;
}) {
  const map = useMap();
  const outlineLayersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Remove previous outlines
    if (outlineLayersRef.current) {
      map.removeLayer(outlineLayersRef.current);
    }

    const layerGroup = L.layerGroup();

    for (const cluster of CLUSTERS) {
      const isHighlighted = highlightedClusterId === cluster.id;

      // Find all GeoJSON features belonging to this cluster
      const clusterFeatures = geoJsonData.features.filter((feature) => {
        if (!feature.properties?.name) return false;
        const geoName = feature.properties.name;
        const dataName = GEOJSON_TO_DATA_NAME[geoName] || geoName;
        return cluster.barangays.some(
          (b) => b.toLowerCase() === dataName.toLowerCase(),
        );
      });

      if (clusterFeatures.length === 0) continue;

      // Draw each feature with the cluster's thick outline
      for (const feature of clusterFeatures) {
        const outlineLayer = L.geoJSON(feature as GeoJSON.Feature, {
          style: {
            color: cluster.borderColor,
            weight: isHighlighted ? 5 : 3,
            fill: false,
            opacity: isHighlighted ? 1 : 0.7,
            dashArray: isHighlighted ? "" : "6 3",
          },
          interactive: false, // Don't interfere with barangay click events
        });
        outlineLayer.addTo(layerGroup);
      }
    }

    layerGroup.addTo(map);
    outlineLayersRef.current = layerGroup;

    return () => {
      if (outlineLayersRef.current) {
        map.removeLayer(outlineLayersRef.current);
      }
    };
  }, [map, geoJsonData, highlightedClusterId]);

  return null;
}

// --- Sub-component: Cluster Highlight (from legend hover/click) ---

function ClusterHighlighter({
  geoJsonData,
  highlightedClusterId,
  shouldFitBounds,
  onFitBoundsComplete,
}: {
  geoJsonData: GeoJSON.FeatureCollection;
  highlightedClusterId: number | null;
  shouldFitBounds: boolean;
  onFitBoundsComplete: () => void;
}) {
  const map = useMap();
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Clear previous highlights
    if (highlightLayerRef.current) {
      map.removeLayer(highlightLayerRef.current);
      highlightLayerRef.current = null;
    }

    if (highlightedClusterId === null) return;

    const cluster = CLUSTERS.find((c) => c.id === highlightedClusterId);
    if (!cluster) return;

    const layerGroup = L.layerGroup();
    const allBounds: L.LatLngBounds[] = [];

    // Find all GeoJSON features for this cluster
    const clusterFeatures = geoJsonData.features.filter((feature) => {
      if (!feature.properties?.name) return false;
      const geoName = feature.properties.name;
      const dataName = GEOJSON_TO_DATA_NAME[geoName] || geoName;
      return cluster.barangays.some(
        (b) => b.toLowerCase() === dataName.toLowerCase(),
      );
    });

    for (const feature of clusterFeatures) {
      const glowLayer = L.geoJSON(feature as GeoJSON.Feature, {
        style: {
          color: cluster.borderColor,
          weight: 4,
          fillColor: cluster.color,
          fillOpacity: 0.25,
          dashArray: "",
        },
        interactive: false,
      });

      glowLayer.addTo(layerGroup);
      allBounds.push(glowLayer.getBounds());
    }

    layerGroup.addTo(map);
    highlightLayerRef.current = layerGroup;

    // Fit bounds if triggered by a click
    if (shouldFitBounds && allBounds.length > 0) {
      let combinedBounds = allBounds[0];
      for (let i = 1; i < allBounds.length; i++) {
        combinedBounds = combinedBounds.extend(allBounds[i]);
      }
      if (combinedBounds.isValid()) {
        map.fitBounds(combinedBounds, { padding: [50, 50], maxZoom: 15 });
      }
      onFitBoundsComplete();
    }

    return () => {
      if (highlightLayerRef.current) {
        map.removeLayer(highlightLayerRef.current);
        highlightLayerRef.current = null;
      }
    };
  }, [map, geoJsonData, highlightedClusterId, shouldFitBounds, onFitBoundsComplete]);

  return null;
}

// --- Main Component ---

export default function WeatherMapView({
  weatherData,
  searchQuery,
  activeClusterFilter,
  onClusterSelect,
}: WeatherMapViewProps) {
  const [geoJsonData, setGeoJsonData] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [geoJsonLoading, setGeoJsonLoading] = useState(true);
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<MapColorMode>("severity");
  const [selectedBarangay, setSelectedBarangay] =
    useState<BarangayWeather | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [highlightedClusterId, setHighlightedClusterId] = useState<
    number | null
  >(null);
  const [shouldFitClusterBounds, setShouldFitClusterBounds] = useState(false);
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

  // NOTE: colorMode and activeClusterFilter are intentionally independent.
  // Users should be able to filter by a cluster AND view it in any coloring mode
  // (severity, flood_risk, or cluster). No useEffect coupling these two states.

  // --- Sync activeClusterFilter from parent toolbar/tiles to map bounds & highlights ---
  useEffect(() => {
    if (activeClusterFilter !== null) {
      setHighlightedClusterId(activeClusterFilter);
      setShouldFitClusterBounds(true);
      setSelectedBarangay(null);
    } else {
      setHighlightedClusterId(null);
    }
  }, [activeClusterFilter]);

  // --- Helper: check if a barangay belongs to the active cluster filter ---
  const isBarangayInActiveFilters = useCallback(
    (barangayName: string): boolean => {
      if (activeClusterFilter === null) return true; // no filter = everything visible
      const cluster = CLUSTERS.find((c) => c.id === activeClusterFilter);
      return (
        cluster?.barangays.some(
          (b) => b.toLowerCase() === barangayName.toLowerCase(),
        ) ?? false
      );
    },
    [activeClusterFilter],
  );

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
      const dataName = GEOJSON_TO_DATA_NAME[featureName] || featureName;
      const weather = findWeatherForFeature(featureName);

      // --- Cluster filter: dim polygons that don't match active filters ---
      const matchesFilter = isBarangayInActiveFilters(dataName);

      let fillColor: string;
      let borderColor = "#6b7280"; // gray-500 default border
      let weight = 1.5;
      let fillOpacity = matchesFilter ? 0.55 : 0.1;

      if (!matchesFilter) {
        // Dimmed style for filtered-out barangays
        return {
          fillColor: "#e5e7eb",
          weight: 1,
          color: "#d1d5db",
          fillOpacity: 0.15,
          dashArray: "",
        };
      }

      if (colorMode === "cluster") {
        // Resolve the data name for cluster lookup
        const cluster = getClusterForBarangay(dataName);
        if (cluster) {
          fillColor = cluster.color;
          borderColor = cluster.borderColor;
          weight = 2;
          fillOpacity = 0.5;
        } else {
          fillColor = "#e5e7eb"; // no cluster assignment
        }
      } else if (colorMode === "flood_risk") {
        // TODO: BACKEND -- Flood risk data comes from the same shared weather
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
        weight,
        color: borderColor,
        fillOpacity,
        dashArray: "",
      };
    },
    [colorMode, findWeatherForFeature, isBarangayInActiveFilters],
  );

  // --- Feature Interaction Handlers ---
  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      if (!feature.properties?.name) return;

      const featureName: string = feature.properties.name;
      const weather = findWeatherForFeature(featureName);
      const dataName = GEOJSON_TO_DATA_NAME[featureName] || featureName;
      const cluster = getClusterForBarangay(dataName);

      // --- Permanent White Text Label on Polygon Center ---
      const displayName = GEOJSON_TO_DATA_NAME[featureName] || featureName;
      const matchesFilter = isBarangayInActiveFilters(displayName);
      const isFilteredOut = activeClusterFilter !== null && !matchesFilter;

      if (isFilteredOut) {
        // Do NOT display text label for non-selected cluster barangays
        (layer as L.Path).unbindTooltip();
      } else {
        const labelContent = `
          <div style="font-weight: 700; font-size: 11px; color: #ffffff; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9); text-align: center; line-height: 1.1; pointer-events: none;">
            ${displayName}
            ${weather ? `<div style="font-size: 10px; font-weight: 600; opacity: 0.95; margin-top: 1px;">${weather.temperature}°C</div>` : ""}
          </div>
        `;

        (layer as L.Path).bindTooltip(labelContent, {
          permanent: true,
          direction: "center",
          className: "barangay-map-label",
          interactive: false,
        });
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
            setSelectedClusterForList(null);
          }
        },
      });
    },
    [findWeatherForFeature, colorMode, isBarangayInActiveFilters, activeClusterFilter],
  );

  // --- Legend Data ---
  const legendItems = useMemo(() => {
    if (colorMode === "cluster") {
      // In cluster mode, the ClusterLegendPanel handles the legend
      return [];
    }

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

  // --- Cluster Legend Handlers ---
  const handleClusterHover = useCallback((clusterId: number | null) => {
    setHighlightedClusterId(clusterId);
  }, []);

  const handleClusterClick = useCallback(
    (clusterId: number) => {
      onClusterSelect(clusterId);
      setSelectedBarangay(null);
    },
    [onClusterSelect],
  );

  const handleFitBoundsComplete = useCallback(() => {
    setShouldFitClusterBounds(false);
  }, []);

  // --- Determine the cluster for the selected barangay (for detail panel) ---
  const selectedBarangayCluster = useMemo(() => {
    if (!selectedBarangay) return null;
    return getClusterForBarangay(selectedBarangay.name) ?? null;
  }, [selectedBarangay]);

  // --- Get the cluster config and its barangay weather data for the cluster list panel ---
  const selectedClusterConfig = useMemo(() => {
    if (activeClusterFilter === null) return null;
    return CLUSTERS.find((c) => c.id === activeClusterFilter) ?? null;
  }, [activeClusterFilter]);

  const selectedClusterBarangayWeather = useMemo(() => {
    if (!selectedClusterConfig) return [];
    return selectedClusterConfig.barangays
      .map((name) => weatherDataByName.get(name.toLowerCase()))
      .filter((w): w is BarangayWeather => w !== undefined)
      .sort((a, b) => {
        const severityOrder = { severe: 0, warning: 1, advisory: 1, normal: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }, [selectedClusterConfig, weatherDataByName]);

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
          <button
            onClick={() => setColorMode("cluster")}
            className={`px-3 py-1.5 rounded-md body-xsmall font-medium transition-all duration-200 ${
              colorMode === "cluster"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            Command Center Clusters
          </button>
        </div>

        {/* Inline Legend (severity/flood_risk modes only) */}
        {colorMode !== "cluster" && (
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
        )}
      </div>

      {/* Map + Detail/Legend Panel Container */}
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
                key={`${colorMode}-${activeClusterFilter ?? "none"}`} // Force re-render when color mode or filter changes
                data={geoJsonData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
                ref={(layer) => {
                  geoJsonLayerRef.current = layer;
                }}
              />
            )}

            {/* Cluster boundary outlines (visible in cluster mode OR when a cluster filter is active) */}
            {(colorMode === "cluster" || activeClusterFilter !== null) && geoJsonData && (
              <ClusterBoundaryOutlines
                geoJsonData={geoJsonData}
                highlightedClusterId={highlightedClusterId}
              />
            )}

            {/* Cluster highlight from legend interaction or active cluster filter */}
            {(colorMode === "cluster" || activeClusterFilter !== null) && geoJsonData && highlightedClusterId !== null && (
              <ClusterHighlighter
                geoJsonData={geoJsonData}
                highlightedClusterId={highlightedClusterId}
                shouldFitBounds={shouldFitClusterBounds}
                onFitBoundsComplete={handleFitBoundsComplete}
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

        {/* Right Panel -- either Detail Card, Cluster Barangay List, or Cluster Legend */}
        {!isFullScreen && (
          <div className="w-full lg:w-[360px] shrink-0 flex flex-col min-h-0">
            {/* Selected Barangay Detail Panel */}
            {selectedBarangay ? (
              <BarangayDetailPanel
                weather={selectedBarangay}
                cluster={selectedBarangayCluster}
                onClose={() => setSelectedBarangay(null)}
              />
            ) : activeClusterFilter !== null && selectedClusterConfig ? (
              /* Cluster Detail Panel — consolidated summary + per-barangay breakdown */
              <ClusterDetailPanel
                cluster={selectedClusterConfig}
                barangayWeather={selectedClusterBarangayWeather}
                weatherByName={weatherDataByName}
                onBack={() => onClusterSelect(null)}
                onBarangaySelect={(w) => {
                  setSelectedBarangay(w);
                }}
              />
            ) : colorMode === "cluster" ? (
              /* Cluster Legend Panel (shown when no barangay is selected) */
              <div className="overflow-y-auto custom-scrollbar flex-1 animate-fade-in">
                <ClusterLegendPanel
                  weatherData={weatherData}
                  highlightedClusterId={highlightedClusterId}
                  onClusterHover={handleClusterHover}
                  onClusterClick={handleClusterClick}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
