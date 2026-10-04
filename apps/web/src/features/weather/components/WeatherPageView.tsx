"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  FiSearch,
  FiRefreshCw,
  FiAlertTriangle,
  FiList,
  FiMap,
  FiMapPin,
} from "react-icons/fi";
import { WiFlood } from "react-icons/wi";
import WeatherCard from "./WeatherCard";
import WeatherCardSkeleton from "./WeatherCardSkeleton";
import { fetchWeatherData } from "../data/weather.mock";
import { calculateFloodRisk } from "../utils/flood-risk";
import { CLUSTERS, getClusterForBarangay } from "../data/clusters";

import { ExportReportButton } from "./ExportReportButton";
import type {
  BarangayWeather,
  WeatherFilterTab,
} from "../types/weather.types";

// Dynamically import the map view — Leaflet requires browser `window` object
// and cannot be server-side rendered.
const WeatherMapView = dynamic(() => import("./WeatherMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
        <div className="w-[200px] h-8 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="w-[300px] h-4 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 rounded-xl bg-gray-200 animate-pulse border border-gray-100 min-h-[600px] h-[70vh]"></div>
      </div>
    </div>
  ),
});

type ViewMode = "list" | "map";

// --- Filter Tabs Config ---

export default function WeatherPageView() {
  const [weatherData, setWeatherData] = useState<BarangayWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);
  const [floodRiskFilters, setFloodRiskFilters] = useState<string[]>([]);
  const [clusterFilters, setClusterFilters] = useState<number[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Cluster Filter State (Single-select) ---
  const [activeClusterFilter, setActiveClusterFilter] = useState<number | null>(
    null,
  );

  // --- Search Autocomplete State ---
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return weatherData.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery, weatherData]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setShowSuggestions(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < searchSuggestions.length) {
        handleSuggestionSelect(searchSuggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSuggestionSelect = useCallback((weather: BarangayWeather) => {
    setSearchQuery(weather.name);
    setSubmittedSearch(weather.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  }, []);

  // TODO: BACKEND - Replace with actual API call + SWR/React Query
  const loadWeatherData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchWeatherData();
      setWeatherData(data);
      setLastRefreshed(new Date());
    } catch {
      setError("Failed to load weather data. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWeatherData();
  }, [loadWeatherData]);

  // TODO: BACKEND - Implement polling interval (e.g. every 15 min)
  // useEffect(() => {
  //   const interval = setInterval(loadWeatherData, 15 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [loadWeatherData]);

  // Manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
     
    loadWeatherData();
  };

  // --- Handle tab change ---
  

  // --- Handle cluster filter select (single-select: click to select, click again to deselect) ---
  const handleClusterSelect = useCallback((clusterId: number | null) => {
    if (clusterId === null) {
      setActiveClusterFilter(null);
    } else {
      setActiveClusterFilter((prev) => (prev === clusterId ? null : clusterId));
    }
  }, []);

  // --- Clear cluster filter ---
  const handleClearClusterFilter = useCallback(() => {
    setActiveClusterFilter(null);
  }, []);

  // --- Filtering logic ---
  // Base data after search but before tab filter
  const searchFilteredData = weatherData.filter((item) =>
    item.name.toLowerCase().includes(submittedSearch.toLowerCase()),
  );

  const filteredData = searchFilteredData.filter((item) => {
    let matchesSeverity = true;
    if (severityFilters.length > 0) {
      matchesSeverity = severityFilters.some(filter => {
        if (filter === "advisory") return item.severity === "advisory" || item.severity === "warning";
        return item.severity === filter;
      });
    }

    let matchesFloodRisk = true;
    if (floodRiskFilters.length > 0) {
      const risk = calculateFloodRisk(item);
      matchesFloodRisk = floodRiskFilters.includes(risk.level);
    }

    let matchesCluster = true;
    if (clusterFilters.length > 0) {
      const clusterId = getClusterForBarangay(item.name)?.id;
      matchesCluster = clusterId ? clusterFilters.includes(clusterId) : false;
    }

    // Map view compatibility (so we can still filter map view by clicking cluster)
    let matchesMapCluster = true;
    if (viewMode === "map" && activeClusterFilter !== null) {
      const cluster = CLUSTERS.find((c) => c.id === activeClusterFilter);
      matchesMapCluster = cluster?.barangays.some((b) => b.toLowerCase() === item.name.toLowerCase()) ?? false;
    }

    return matchesSeverity && matchesFloodRisk && matchesCluster && matchesMapCluster;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    // Primary sort: Severity
    const severityOrder = { severe: 0, warning: 1, advisory: 1, normal: 2 };
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    
    // Secondary sort: Flood Risk Score
    const riskA = calculateFloodRisk(a);
    const riskB = calculateFloodRisk(b);
    if (riskA.score !== riskB.score) return riskB.score - riskA.score;

    return a.name.localeCompare(b.name);
  });

  // Base data for tab counts: apply cluster filter first so tab counts reflect the filtered subset
  const clusterFilteredData =
    activeClusterFilter !== null
      ? searchFilteredData.filter((d) => {
          const cluster = CLUSTERS.find((c) => c.id === activeClusterFilter);
          return (
            cluster?.barangays.some(
              (b) => b.toLowerCase() === d.name.toLowerCase(),
            ) ?? false
          );
        })
      : searchFilteredData;

  // Tab counts (reflect cluster filter if active)
  const tabCounts: Record<WeatherFilterTab, number> = {
    all: clusterFilteredData.length,
    severe: clusterFilteredData.filter((d) => d.severity === "severe").length,
    advisory: clusterFilteredData.filter(
      (d) => d.severity === "advisory" || d.severity === "warning",
    ).length,
    flood_risk: clusterFilteredData.filter((d) => {
      const risk = calculateFloodRisk(d);
      return risk.level === "elevated" || risk.level === "high";
    }).length,
    cluster:
      activeClusterFilter !== null
        ? searchFilteredData.filter((d) => {
            const cluster = CLUSTERS.find((c) => c.id === activeClusterFilter);
            return (
              cluster?.barangays.some(
                (b) => b.toLowerCase() === d.name.toLowerCase(),
              ) ?? false
            );
          }).length
        : searchFilteredData.length,
  };

  // Format last refreshed timestamp
  const formatLastRefreshed = (date: Date | null): string => {
    if (!date) return "—";
    return date.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Cluster badge for list view cards (shown when a cluster filter is active)
  const renderClusterBadge = (_weather: BarangayWeather) => {
    return null; // Disabled to prevent inconsistent card layout
  };

  return (
    <div className="bg-white h-max rounded-xl w-full px-5 py-6 flex flex-col">
      {/* Header */}
      <div className="mb-4 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="w-max">
            <h1 className="display-small text-gray-900 inline-block">
              Weather Monitoring
            </h1>
            <div className="divider-primary-half" />
          </div>
          <ExportReportButton weatherData={weatherData} />
        </div>
        <p className="body-small text-gray-500">
          Real-time weather conditions across all Taguig City barangays.
        </p>
      </div>

      {/* Toolbar */}
      <div className="space-y-4 shrink-0 mb-4">
        {/* Search + View Toggle + Refresh Row */}
        <div className="flex items-center gap-3">
          {/* Search Input Autocomplete */}
          <div className="relative flex-1" ref={searchContainerRef}>
            <input
              type="text"
              placeholder="Search barangay..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
                if (e.target.value === "") {
                  setSubmittedSearch("");
                }
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSuggestions(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-5 pr-10 py-4 border border-gray-200 rounded-full body-small focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
            />
            <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[15px] h-[15px]" />

            {/* Suggestions Dropdown */}
            {showSuggestions && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 max-h-64 overflow-y-auto custom-scrollbar">
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevents input from losing focus if needed
                        handleSuggestionSelect(suggestion);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${
                        index === highlightedIndex
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <FiMapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="body-small text-gray-700 font-medium truncate">
                        {suggestion.name}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500 body-small">
                    No matching barangays found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List / Map View Toggle */}
          <div className="inline-flex p-1 bg-gray-100 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode("map")}
              title="Map view"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md body-xsmall font-medium transition-all duration-200 ${
                viewMode === "map"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              <FiMap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md body-xsmall font-medium transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              <FiList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Last Refreshed Indicator */}
          <span className="body-xsmall text-gray-400 shrink-0 hidden sm:inline">
            Last updated: {formatLastRefreshed(lastRefreshed)}
          </span>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh weather data"
            className="text-gray-500 hover:text-gray-700 transition-all duration-200 shrink-0 p-2 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw
              className={`w-[18px] h-[18px] ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

                {/* List View Combined Filters */}
        {viewMode === "list" && (
          <div className="flex items-center justify-end w-full mt-2 relative">
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="body-small font-medium">Filters</span>
              {(severityFilters.length > 0 || floodRiskFilters.length > 0 || clusterFilters.length > 0) && (
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-1">
                  {severityFilters.length + floodRiskFilters.length + clusterFilters.length}
                </span>
              )}
            </button>

            {isFilterMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="body-small font-semibold text-gray-900">Filters</h3>
                  <button 
                    onClick={() => {
                      setSeverityFilters([]);
                      setFloodRiskFilters([]);
                      setClusterFilters([]);
                    }}
                    className="text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    Clear All
                  </button>
                </div>
                
                {/* Severity */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Severity</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'severe', label: 'Severe' },
                      { id: 'advisory', label: 'Advisory' },
                      { id: 'normal', label: 'Normal' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={severityFilters.includes(opt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSeverityFilters([...severityFilters, opt.id]);
                            else setSeverityFilters(severityFilters.filter(id => id !== opt.id));
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                        />
                        <span className="body-small text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Flood Risk */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Flood Risk</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'high', label: 'High Risk' },
                      { id: 'elevated', label: 'Elevated Risk' },
                      { id: 'moderate', label: 'Moderate Risk' },
                      { id: 'low', label: 'Low Risk' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={floodRiskFilters.includes(opt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setFloodRiskFilters([...floodRiskFilters, opt.id]);
                            else setFloodRiskFilters(floodRiskFilters.filter(id => id !== opt.id));
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                        />
                        <span className="body-small text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clusters */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Clusters</h4>
                  <div className="space-y-2">
                    {CLUSTERS.map(cluster => (
                      <label key={cluster.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clusterFilters.includes(cluster.id)}
                          onChange={(e) => {
                            if (e.target.checked) setClusterFilters([...clusterFilters, cluster.id]);
                            else setClusterFilters(clusterFilters.filter(id => id !== cluster.id));
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                        />
                        <span className="body-small text-gray-700">{cluster.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="border-t border-gray-100 pt-4 flex flex-col">
        {/* Loading State for List View */}
        {loading && viewMode === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <WeatherCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Loading State for Map View */}
        {loading && viewMode === "map" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
              <div className="w-[200px] h-8 bg-gray-200 animate-pulse rounded-md"></div>
              <div className="w-[300px] h-4 bg-gray-200 animate-pulse rounded-md"></div>
            </div>
            <div className="flex-1 flex gap-4 min-h-0">
              <div className="flex-1 rounded-xl bg-gray-200 animate-pulse border border-gray-100 min-h-[600px] h-[70vh]"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
              <FiAlertTriangle className="w-7 h-7 text-danger" />
            </div>
            <div className="text-center">
              <p className="body-medium text-gray-900 font-medium">
                Unable to load weather data
              </p>
              <p className="body-small text-gray-500 mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg body-small font-medium transition-all duration-200 shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* --- LIST VIEW --- */}
        {!loading && !error && viewMode === "list" && (
          <>
            {/* Empty State (search/filter yields no results) */}
            {sortedData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiSearch className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="body-medium text-gray-900 font-medium">
                    No barangays found
                  </p>
                  <p className="body-small text-gray-500 mt-1">
                    {submittedSearch
                      ? `No results for "${submittedSearch}". Try a different search term.`
                      : "No barangays match the selected filter."}
                  </p>
                </div>
              </div>
            )}

            {/* Weather Cards Grid */}
            {sortedData.length > 0 && (
              <div className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
                {sortedData.map((weather) => (
                  <div key={weather.id} className="h-full flex flex-col">
                    {renderClusterBadge(weather)}
                    <WeatherCard weather={weather} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- MAP VIEW --- */}
        {!loading && !error && viewMode === "map" && (
          <WeatherMapView
            weatherData={weatherData}
            searchQuery={submittedSearch}
            activeClusterFilter={activeClusterFilter}
            onClusterSelect={handleClusterSelect}
            onSearchClear={() => {
              setSearchQuery("");
              setSubmittedSearch("");
            }}
          />
        )}
      </div>
    </div>
  );
}
