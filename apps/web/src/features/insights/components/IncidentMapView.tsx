"use client";

/**
 * IncidentMapView — Reuses the same GeoJSON polygon barangay map from WeatherMapView.
 * Shows all 38 Taguig barangays as coloured polygons shaded by incident density.
 * When a barangay filter is active, the selected barangay is highlighted and zoomed into.
 * Incident markers are rendered on top of the polygons.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { InsightsIncident } from "../api/insights.api";

interface Props {
  incidents: InsightsIncident[];
  isLoading: boolean;
  selectedBarangay?: string; // from filter
}

const TAGUIG_CENTER: [number, number] = [14.5176, 121.0509];
const DEFAULT_ZOOM = 13;

// GeoJSON name normaliser (matches WeatherMapView's GEOJSON_TO_DATA_NAME pattern)
const GEOJSON_NAME_VARIANTS: Record<string, string[]> = {
  Palingon: ["Palingon-Tipas"],
};

function resolveGeoJsonName(geoName: string): string[] {
  return GEOJSON_NAME_VARIANTS[geoName] ?? [geoName];
}

// Custom incident markers
const createMarkerIcon = (color: string) =>
  L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

const ICONS = {
  active: createMarkerIcon("#ef4444"),
  dispatched: createMarkerIcon("#f59e0b"),
  resolved: createMarkerIcon("#10b981"),
  default: createMarkerIcon("#60a5fa"),
};

const getIcon = (status: string) =>
  ICONS[status as keyof typeof ICONS] ?? ICONS.default;

// ── Inner: captures map ref without DOM output ─────────────────────────────
function MapController({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

// ── Inner: handles ResizeObserver so map tiles don't grey-out ─────────────
function MapResizer({ isFullScreen }: { isFullScreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !map.getContainer()) return;
    const ro = new ResizeObserver(() => {
      try {
        if (map.getContainer()) map.invalidateSize();
      } catch (e) {
        console.warn("Leaflet resize error:", e);
      }
    });
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);

  // Extra invalidation pulses after fullscreen transition so tiles render correctly
  useEffect(() => {
    const invalidateSafe = () => {
      try {
        if (map && map.getContainer()) map.invalidateSize();
      } catch (e) {
        console.warn("Leaflet timeout resize error:", e);
      }
    };
    const t1 = setTimeout(invalidateSafe, 150);
    const t2 = setTimeout(invalidateSafe, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map, isFullScreen]);

  return null;
}

// ── Inner: pans/zooms to the selected barangay polygon ────────────────────
function BarangayFocusHandler({
  selectedBarangay,
  geoJsonData,
  geoJsonLayerRef,
}: {
  selectedBarangay: string;
  geoJsonData: GeoJSON.FeatureCollection | null;
  geoJsonLayerRef: React.MutableRefObject<L.GeoJSON | null>;
}) {
  const map = useMap();
  const highlightRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    // Remove previous highlight
    if (highlightRef.current) {
      map.removeLayer(highlightRef.current);
      highlightRef.current = null;
    }

    if (!selectedBarangay || !geoJsonData) return;

    const normalised = selectedBarangay.toLowerCase().trim();

    const feature = geoJsonData.features.find((f) => {
      const geoName: string = f.properties?.name ?? "";
      const aliases = resolveGeoJsonName(geoName);
      return aliases.some((a) => a.toLowerCase() === normalised) ||
        geoName.toLowerCase() === normalised;
    });

    if (!feature) return;

    const highlight = L.geoJSON(feature as GeoJSON.Feature, {
      style: {
        color: "#2563eb",
        weight: 3,
        fillColor: "#3b82f6",
        fillOpacity: 0.2,
        dashArray: "6 3",
      },
    });

    highlight.addTo(map);
    highlightRef.current = highlight;

    const bounds = highlight.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }

    return () => {
      if (highlightRef.current) {
        map.removeLayer(highlightRef.current);
        highlightRef.current = null;
      }
    };
  }, [selectedBarangay, geoJsonData, map]);

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────
export function IncidentMapView({ incidents, isLoading, selectedBarangay = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for native fullscreen changes (e.g. user presses Escape)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) =>
        console.error("Fullscreen error:", err)
      );
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => { setMounted(true); }, []);

  // Load GeoJSON once — same file as WeatherMapView
  useEffect(() => {
    fetch("/geojsons/taguig-barangays.geojson")
      .then((r) => r.json())
      .then(setGeoJsonData)
      .catch((e) => console.error("Failed to load barangay GeoJSON", e));
  }, []);

  // Build incident count per barangay for polygon shading
  const incidentCountByBarangay = useMemo(() => {
    const map = new Map<string, number>();
    incidents.forEach((i) => {
      if (!i.barangay) return;
      map.set(i.barangay.toLowerCase(), (map.get(i.barangay.toLowerCase()) ?? 0) + 1);
    });
    return map;
  }, [incidents]);

  // Note: maxCount is no longer used for color scaling to avoid false 'red' alerts on low volume, 
  // but kept if we want to do dynamic radius markers later.

  const getFeatureStyle = useCallback(
    (feature: GeoJSON.Feature | undefined): L.PathOptions => {
      const geoName: string = feature?.properties?.name ?? "";
      const aliases = resolveGeoJsonName(geoName);
      const count = aliases.reduce(
        (acc, name) => acc + (incidentCountByBarangay.get(name.toLowerCase()) ?? 0),
        0
      );

      // Real-world practical absolute scale:
      // Green = 1-4 incidents, Amber = 5-9 incidents, Red = 10+ incidents
      let fillColor = "#10b981"; // default/none
      if (count >= 10) {
        fillColor = "#ef4444"; // red
      } else if (count >= 5) {
        fillColor = "#f59e0b"; // amber
      } else if (count >= 1) {
        fillColor = "#10b981"; // green
      }

      return {
        fillColor,
        weight: 1.5,
        color: "#6b7280",
        fillOpacity: count > 0 ? 0.6 : 0.2,
        dashArray: "",
      };
    },
    [incidentCountByBarangay]
  );

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const geoName: string = feature.properties?.name ?? "";
      if (!geoName) return;

      const aliases = resolveGeoJsonName(geoName);
      const count = aliases.reduce(
        (acc, name) => acc + (incidentCountByBarangay.get(name.toLowerCase()) ?? 0),
        0
      );

      (layer as L.Path).bindTooltip(
        `<div style="font-family:Inter,sans-serif;min-width:130px;">
          <div style="font-weight:600;font-size:13px;margin-bottom:3px;">${geoName}</div>
          <div style="font-size:12px;color:#6b7280;">${count} incident${count !== 1 ? "s" : ""}</div>
        </div>`,
        { sticky: true, direction: "top", offset: [0, -8], className: "weather-map-tooltip" }
      );

      const path = layer as L.Path;
      path.on({
        mouseover: () => {
          path.setStyle({ weight: 3, color: "#1d4ed8", fillOpacity: 0.7 });
          path.bringToFront();
        },
        mouseout: () => {
          if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(path);
        },
      });
    },
    [incidentCountByBarangay]
  );

  const validIncidents = incidents.filter((i) => i.latitude != null && i.longitude != null);

  const handleRecenter = () => {
    mapRef.current?.setView(TAGUIG_CENTER, DEFAULT_ZOOM);
  };

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-gray-500 font-medium">Loading Map…</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden border border-gray-200 relative z-0"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-3 z-[400] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2.5 shadow-sm text-xs space-y-1.5">
        <p className="font-semibold text-gray-600 mb-1">Incident Density</p>
        {[
          { color: "#ef4444", label: "High (10+)" },
          { color: "#f59e0b", label: "Medium (5-9)" },
          { color: "#10b981", label: "Low (1-4)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm border border-gray-300 shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Marker Legend */}
      <div className="absolute bottom-6 left-36 z-[400] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2.5 shadow-sm text-xs space-y-1.5">
        <p className="font-semibold text-gray-600 mb-1">Incidents</p>
        {[
          { color: "#ef4444", label: "Active" },
          { color: "#f59e0b", label: "Dispatched" },
          { color: "#10b981", label: "Resolved" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar — outside MapContainer to avoid Leaflet DOM crash */}
      <div className="absolute top-3 right-3 z-[400] flex gap-2">
        <button
          onClick={handleRecenter}
          className="bg-white border border-gray-200 px-3 py-1.5 shadow-sm rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
          title="Recenter on Taguig"
        >
          ⌖ Recenter
        </button>
        <button
          onClick={toggleFullScreen}
          className="bg-white border border-gray-200 p-2 shadow-sm rounded-md hover:bg-gray-50 text-gray-700 hover:text-primary transition-colors cursor-pointer"
          title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
        >
          {isFullScreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
        </button>
      </div>

      <MapContainer
        center={TAGUIG_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={11}
        maxBounds={[[14.4500, 121.0000], [14.5800, 121.1200]]}
        maxBoundsViscosity={1.0}
        style={{ width: "100%", height: "100%" }}
        className="z-0 absolute inset-0"
        scrollWheelZoom
      >
        <MapController mapRef={mapRef} />
        <MapResizer isFullScreen={isFullScreen} />

        {/* Dark tile layer matching WeatherMapView aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />

        {/* Barangay polygon GeoJSON overlay — same file as WeatherMapView */}
        {geoJsonData && (
          <GeoJSON
            key={`${incidentCountByBarangay.size}-${selectedBarangay}`}
            data={geoJsonData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
            ref={(layer) => { geoJsonLayerRef.current = layer; }}
          />
        )}

        {/* Barangay filter → pan+highlight */}
        {geoJsonData && (
          <BarangayFocusHandler
            selectedBarangay={selectedBarangay}
            geoJsonData={geoJsonData}
            geoJsonLayerRef={geoJsonLayerRef}
          />
        )}

        {/* Incident markers on top of polygons */}
        {validIncidents.map((incident) => {
          const latLng = L.latLng(incident.latitude!, incident.longitude!);
          const distKm = (latLng.distanceTo(L.latLng(TAGUIG_CENTER[0], TAGUIG_CENTER[1])) / 1000).toFixed(2);

          let responseTime = "Ongoing";
          if (incident.resolved_at) {
            const mins = Math.round(
              (new Date(incident.resolved_at).getTime() - new Date(incident.created_at).getTime()) / 60000
            );
            responseTime = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
          }

          return (
            <Marker key={incident.id} position={[incident.latitude!, incident.longitude!]} icon={getIcon(incident.status)}>
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>{incident.reference_no}</p>
                  <p style={{ margin: 0 }}>Response: <strong>{responseTime}</strong></p>
                  <p style={{ margin: 0 }}>Distance: <strong>{distKm} km</strong> from HQ</p>
                </div>
              </Tooltip>
              <Popup>
                <div style={{ padding: 2 }}>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>{incident.reference_no}</p>
                  <p style={{ fontSize: 13 }}>Status: <strong style={{ textTransform: "capitalize" }}>{incident.status}</strong></p>
                  {incident.incident_type && <p style={{ fontSize: 13 }}>Type: <span style={{ textTransform: "capitalize" }}>{incident.incident_type}</span></p>}
                  {incident.barangay && <p style={{ fontSize: 13 }}>Brgy: {incident.barangay}</p>}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
                    <p style={{ fontSize: 13, color: "#555" }}>Response: <strong>{responseTime}</strong></p>
                    <p style={{ fontSize: 13, color: "#555" }}>{distKm} km from Command Center</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
