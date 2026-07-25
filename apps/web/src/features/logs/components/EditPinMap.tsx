"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiMaximize, FiMinimize, FiMapPin, FiX, FiCheck } from "react-icons/fi";
import { TAGUIG_BARANGAYS } from "@/lib/barangays";

const TAGUIG_CENTER: [number, number] = [14.5176, 121.0509];

const EditPinIcon = L.divIcon({
  className: "edit-pin-icon",
  html: `<div style="background-color:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const GEOJSON_NAME_VARIANTS: Record<string, string[]> = { Palingon: ["Palingon-Tipas"] };
function resolveGeoJsonName(geoName: string): string[] {
  return GEOJSON_NAME_VARIANTS[geoName] ?? [geoName];
}

function LocationPicker({ position, setPosition }: { position: [number, number] | null; setPosition: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position} icon={EditPinIcon} /> : null;
}

function MapResizer({ dep }: { dep: boolean }) {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map, dep]);
  return null;
}

function BarangayZoomer({ barangay, geoJsonData }: { barangay: string; geoJsonData: GeoJSON.FeatureCollection | null }) {
  const map = useMap();
  const highlightRef = useRef<L.GeoJSON | null>(null);
  useEffect(() => {
    if (highlightRef.current) { map.removeLayer(highlightRef.current); highlightRef.current = null; }
    if (!barangay || !geoJsonData) return;
    const norm = barangay.toLowerCase().trim();
    const feature = geoJsonData.features.find((f) => {
      const geoName: string = f.properties?.name ?? "";
      const aliases = resolveGeoJsonName(geoName);
      return aliases.some((a) => a.toLowerCase() === norm) || geoName.toLowerCase() === norm;
    });
    if (!feature) return;
    const hl = L.geoJSON(feature as GeoJSON.Feature, { style: { color: "#2563eb", weight: 3, fillColor: "#3b82f6", fillOpacity: 0.2, dashArray: "6 3" } });
    hl.addTo(map);
    highlightRef.current = hl;
    const bounds = hl.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    return () => { if (highlightRef.current) { map.removeLayer(highlightRef.current); highlightRef.current = null; } };
  }, [barangay, geoJsonData, map]);
  return null;
}

interface Props {
  initialLat: number | null;
  initialLng: number | null;
  barangay: string;
  onSave: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export function EditPinMap({ initialLat, initialLng, barangay, onSave, disabled }: Props) {
  // Prisma Decimal fields serialize as strings over JSON — coerce to number
  const lat = initialLat != null ? Number(initialLat) : null;
  const lng = initialLng != null ? Number(initialLng) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(
    lat != null && lng != null ? [lat, lng] : null
  );
  const [selectedBarangay, setSelectedBarangay] = useState(barangay ?? "");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/geojsons/taguig-barangays.geojson")
      .then((r) => r.json())
      .then(setGeoJsonData)
      .catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    setPosition(lat != null && lng != null ? [lat, lng] : null);
    setSelectedBarangay(barangay ?? "");
  }, [initialLat, initialLng, barangay]);

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  const handleSave = () => {
    if (!position) return;
    onSave(position[0], position[1]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setPosition(lat != null && lng != null ? [lat, lng] : null);
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FiMapPin className="w-3.5 h-3.5 shrink-0" />
          {lat != null && lng != null ? (
            <span className="font-mono text-[10px] text-foreground/70">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          ) : (
            <span className="text-foreground/40 italic">No pin set</span>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors cursor-pointer"
          >
            <FiMapPin className="w-3 h-3" />
            {isOpen ? "Close Map" : lat != null ? "Correct Pin" : "Set Pin"}
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={containerRef}
          className={`rounded-xl overflow-hidden border border-background-subtle relative ${isFullScreen ? "fixed inset-0 z-[9999] rounded-none" : "h-[300px]"}`}
        >
          <div className="absolute top-2 right-2 z-[500] flex gap-1.5">
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">Zoom to Barangay…</option>
              {TAGUIG_BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button
              onClick={toggleFullScreen}
              className="bg-white border border-gray-200 p-1.5 shadow-sm rounded-md hover:bg-gray-50 text-gray-700 hover:text-primary transition-colors cursor-pointer"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? <FiMinimize className="w-3.5 h-3.5" /> : <FiMaximize className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <FiX className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!position}
              className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-3 py-1.5 text-xs font-medium shadow hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiCheck className="w-3 h-3" /> Save Pin
            </button>
          </div>

          <div className="absolute top-2 left-2 z-[500] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md px-2 py-1 text-[10px] text-gray-600 shadow-sm pointer-events-none">
            Click anywhere on the map to {position ? "move" : "place"} the pin
          </div>

          <MapContainer
            center={position ?? TAGUIG_CENTER}
            zoom={lat != null ? 16 : 13}
            minZoom={11}
            maxBounds={[[14.45, 121.00], [14.58, 121.12]]}
            maxBoundsViscosity={1.0}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom
          >
            <MapResizer dep={isFullScreen} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoJsonData && (
              <GeoJSON
                key="barangay-geo"
                data={geoJsonData}
                style={{ weight: 1, color: "#6b7280", fillColor: "#3b82f6", fillOpacity: 0.08 }}
              />
            )}
            {geoJsonData && <BarangayZoomer barangay={selectedBarangay} geoJsonData={geoJsonData} />}
            <LocationPicker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}
