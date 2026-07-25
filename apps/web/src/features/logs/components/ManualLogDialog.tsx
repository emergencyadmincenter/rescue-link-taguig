"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiPlus,
  FiAlertCircle,
  FiPhoneCall,
  FiMessageSquare,
  FiSmartphone,
  FiRadio,
  FiUser,
  FiShield,
  FiWind,
  FiHeart,
  FiDroplet,
  FiBriefcase,
  FiMapPin,
  FiTruck,
  FiBatteryCharging,
  FiMaximize,
  FiMinimize,
} from "react-icons/fi";
import { logsApi } from "../api/logs.api";
import { Resource, CreateLogPayload } from "../types/logs.types";
import { toast } from "react-hot-toast";
import SelectorDialog, { SelectorOption } from "./SelectorDialog";
import StatusSelector from "./StatusSelector";
import { LogStatus } from "../types/logs.types";
import { TAGUIG_BARANGAYS } from "@/lib/barangays";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create a custom modern pin icon using a div instead of external image files
const CustomPinIcon = L.divIcon({
  className: "custom-pin-icon",
  html: `<div style="
    background-color: #ef4444;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 8px rgba(0,0,0,0.5);
    transform: translate(-50%, -50%);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
L.Marker.prototype.options.icon = CustomPinIcon;

const TAGUIG_CENTER: [number, number] = [14.5176, 121.0509];

// GeoJSON name normaliser
const GEOJSON_NAME_VARIANTS: Record<string, string[]> = {
  Palingon: ["Palingon-Tipas"],
};

function resolveGeoJsonName(geoName: string): string[] {
  return GEOJSON_NAME_VARIANTS[geoName] ?? [geoName];
}

// ── Inner: Handles map clicks and resizes ────────────────────────
function LocationPickerMap({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null; 
  setPosition: (p: [number, number]) => void 
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

// ── Inner: handles ResizeObserver so map tiles don't grey-out ─────────────
function MapResizer({ isFullScreen }: { isFullScreen: boolean }) {
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
  }, [map, isFullScreen]);
  return null;
}

// ── Inner: pans/zooms to the selected barangay polygon ────────────────────
function BarangayFocusHandler({
  selectedBarangay,
  geoJsonData,
}: {
  selectedBarangay: string;
  geoJsonData: GeoJSON.FeatureCollection | null;
}) {
  const map = useMap();
  const highlightRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (highlightRef.current) {
      map.removeLayer(highlightRef.current);
      highlightRef.current = null;
    }

    if (!selectedBarangay || !geoJsonData) return;

    const normalised = selectedBarangay.toLowerCase().trim();
    const feature = geoJsonData.features.find((f) => {
      const geoName: string = f.properties?.name ?? "";
      const aliases = resolveGeoJsonName(geoName);
      return aliases.some((a) => a.toLowerCase() === normalised) || geoName.toLowerCase() === normalised;
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

interface ManualLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resources: Resource[];
}

const PREDEFINED_CHANNELS: SelectorOption[] = [
  { id: "hotline", label: "Emergency Hotline", icon: <FiPhoneCall /> },
  { id: "mobile", label: "Mobile Call", icon: <FiSmartphone /> },
  { id: "sms", label: "SMS", icon: <FiMessageSquare /> },
  { id: "radio", label: "Radio", icon: <FiRadio /> },
  { id: "walkin", label: "Walk-in Report", icon: <FiUser /> },
  { id: "coordinator", label: "Barangay Coordinator", icon: <FiUser /> },
  { id: "police", label: "Police", icon: <FiShield /> },
  { id: "fire", label: "Fire Department", icon: <FiWind /> },
  { id: "ambulance", label: "Ambulance", icon: <FiHeart /> },
  { id: "social", label: "Social Media", icon: <FiMessageSquare /> },
];

const PREDEFINED_NEEDS_FALLBACK: SelectorOption[] = [
  { id: "custom_Food", label: "Food", icon: <FiBriefcase /> },
  { id: "custom_Drinking Water", label: "Drinking Water", icon: <FiDroplet /> },
  { id: "custom_Rescue", label: "Rescue", icon: <FiHeart /> },
  { id: "custom_First Aid", label: "First Aid", icon: <FiHeart /> },
  { id: "custom_Medical Assistance", label: "Medical Assistance", icon: <FiHeart /> },
  { id: "custom_Ambulance", label: "Ambulance", icon: <FiTruck /> },
  { id: "custom_Shelter", label: "Shelter", icon: <FiMapPin /> },
  { id: "custom_Evacuation", label: "Evacuation", icon: <FiMapPin /> },
  { id: "custom_Clothing", label: "Clothing", icon: <FiBriefcase /> },
  { id: "custom_Baby Supplies", label: "Baby Supplies", icon: <FiBriefcase /> },
  { id: "custom_Hygiene Kit", label: "Hygiene Kit", icon: <FiDroplet /> },
  { id: "custom_Transportation", label: "Transportation", icon: <FiTruck /> },
  { id: "custom_Generator", label: "Generator", icon: <FiBatteryCharging /> },
  { id: "custom_Flashlight", label: "Flashlight", icon: <FiBatteryCharging /> },
  { id: "custom_Fuel", label: "Fuel", icon: <FiBatteryCharging /> },
  { id: "custom_Oxygen", label: "Oxygen", icon: <FiWind /> },
  { id: "custom_Blood Donation", label: "Blood Donation", icon: <FiHeart /> },
];

export default function ManualLogDialog({
  isOpen,
  onClose,
  onSuccess,
  resources,
}: ManualLogDialogProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<LogStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Location pinning
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [selectedNeeds, setSelectedNeeds] = useState<SelectorOption[]>([]);
  const [isNeedsOpen, setIsNeedsOpen] = useState(false);

  const [selectedChannels, setSelectedChannels] = useState<SelectorOption[]>([]);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);

  const predefinedNeeds: SelectorOption[] = (() => {
    const fallbackLabels = new Set(PREDEFINED_NEEDS_FALLBACK.map((n) => n.label.toLowerCase()));
    const dbNeeds: SelectorOption[] = resources
      .filter((r) => !fallbackLabels.has(r.name.toLowerCase()))
      .map((r) => ({ id: r.id, label: r.name, icon: <FiBriefcase /> }));
    return [...PREDEFINED_NEEDS_FALLBACK, ...dbNeeds];
  })();

  // Fetch GeoJSON on mount
  useEffect(() => {
    fetch("/geojsons/taguig-barangays.geojson")
      .then((r) => r.json())
      .then(setGeoJsonData)
      .catch((e) => console.error("Failed to load barangay GeoJSON", e));
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(document.fullscreenElement === mapContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setContact("");
      setAddress("");
      setBarangay("");
      setDescription("");
      setStatus("active");
      setSelectedNeeds([]);
      setSelectedChannels([]);
      setPinPosition(null);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = "Name is required";
    if (!contact) newErrors.contact = "Contact is required";
    if (!address) newErrors.address = "Location/Address is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLogPayload = {
        caller_name: name,
        caller_contact: contact,
        address,
        barangay: barangay || undefined,
        description,
        latitude: pinPosition ? pinPosition[0] : undefined,
        longitude: pinPosition ? pinPosition[1] : undefined,
        resource_ids: selectedNeeds.length > 0 ? selectedNeeds.map((n) => n.id) : undefined,
        channels: selectedChannels.length > 0 ? selectedChannels.map((c) => c.label) : undefined,
        status,
      };
      await logsApi.createLog(payload);
      toast.success("Emergency log created successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create emergency log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeNeed = (id: string) => setSelectedNeeds((prev) => prev.filter((n) => n.id !== id));
  const removeChannel = (id: string) => setSelectedChannels((prev) => prev.filter((c) => c.id !== id));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-[480px] flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-[18px] h-[18px] text-gray-700" />
              <h2 className="title-small text-gray-900">Add Log Emergency</h2>
            </div>
            <StatusSelector currentStatus={status} onStatusChange={setStatus} />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <form id="manual-log-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((p) => ({ ...p, name: "" }));
                    }}
                    className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
                  />
                  {errors.name && <p className="text-danger body-xsmall mt-1">{errors.name}</p>}
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Contact number"
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      setErrors((p) => ({ ...p, contact: "" }));
                    }}
                    className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
                  />
                  {errors.contact && <p className="text-danger body-xsmall mt-1">{errors.contact}</p>}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Address or Landmark"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setErrors((p) => ({ ...p, address: "" }));
                  }}
                  className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
                />
                {errors.address && <p className="text-danger body-xsmall mt-1">{errors.address}</p>}
              </div>

              <div>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full px-0 py-2 body-small text-gray-900 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
                >
                  <option value="" disabled>Select Barangay (Optional)</option>
                  {TAGUIG_BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Map Pinning with GeoJSON overlay */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="body-xsmall font-medium text-gray-500">Pin Location on Map (Optional)</p>
                  {pinPosition && (
                    <button 
                      type="button" 
                      onClick={() => setPinPosition(null)}
                      className="text-danger hover:text-danger-hover text-xs font-medium"
                    >
                      Clear Pin
                    </button>
                  )}
                </div>
                
                <div 
                  ref={mapContainerRef} 
                  className={`w-full rounded-lg border border-gray-200 overflow-hidden relative z-0 ${isFullScreen ? 'h-screen' : 'h-[250px]'}`}
                >
                  <button
                    type="button"
                    onClick={toggleFullScreen}
                    className="absolute top-3 right-3 z-[400] bg-white border border-gray-200 p-2 shadow-sm rounded-md hover:bg-gray-50 text-gray-700 hover:text-primary transition-colors cursor-pointer"
                    title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                  >
                    {isFullScreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
                  </button>

                  <MapContainer
                    center={TAGUIG_CENTER}
                    zoom={12}
                    minZoom={11}
                    maxBounds={[[14.4500, 121.0000], [14.5800, 121.1200]]}
                    maxBoundsViscosity={1.0}
                    className="w-full h-full z-0 absolute inset-0"
                  >
                    <MapResizer isFullScreen={isFullScreen} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      className="dark-map-tiles"
                    />

                    {geoJsonData && (
                      <GeoJSON
                        data={geoJsonData}
                        style={{
                          fillColor: "#10b981", // basic green
                          weight: 1.5,
                          color: "#6b7280",
                          fillOpacity: 0.15,
                          dashArray: "",
                        }}
                      />
                    )}

                    {geoJsonData && (
                      <BarangayFocusHandler
                        selectedBarangay={barangay}
                        geoJsonData={geoJsonData}
                      />
                    )}

                    <LocationPickerMap position={pinPosition} setPosition={setPinPosition} />
                  </MapContainer>
                </div>
                {!pinPosition && (
                  <p className="text-xs text-gray-400 mt-1 italic">Click anywhere on the map to drop a pin.</p>
                )}
                {pinPosition && (
                  <p className="text-xs text-primary mt-1 font-medium">Pin placed at: {pinPosition[0].toFixed(4)}, {pinPosition[1].toFixed(4)}</p>
                )}
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Emergency description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent resize-none transition-colors"
                />
              </div>

              {/* Channels Section */}
              <div className="pt-2">
                <p className="body-xsmall font-medium text-gray-500 mb-2">Channels</p>
                <div className="flex flex-wrap gap-2" style={{ overflow: "auto" }}>
                  {selectedChannels.map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 body-xsmall font-medium border border-gray-200 max-w-full">
                      {c.icon && <span className="text-gray-500 shrink-0">{c.icon}</span>}
                      <span className="truncate max-w-[140px]">{c.label}</span>
                      <button type="button" onClick={() => removeChannel(c.id)} className="text-gray-400 hover:text-primary ml-1 shrink-0"><FiX className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setIsChannelsOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 body-xsmall font-medium transition-colors shrink-0">
                    <FiPlus className="w-3 h-3" /> Add Channel
                  </button>
                </div>
              </div>

              {/* Needs Section */}
              <div className="pt-2 pb-4">
                <p className="body-xsmall font-medium text-gray-500 mb-2">Needs</p>
                <div className="flex flex-wrap gap-2" style={{ overflow: "auto" }}>
                  {selectedNeeds.map((n) => (
                    <span key={n.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full body-xsmall font-medium max-w-full bg-gray-100 text-gray-700 border border-dashed border-gray-300">
                      {n.icon && <span className="opacity-80 shrink-0">{n.icon}</span>}
                      <span className="truncate max-w-[140px]">{n.label}</span>
                      <button type="button" onClick={() => removeNeed(n.id)} className="text-gray-400 hover:text-primary ml-1 shrink-0"><FiX className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setIsNeedsOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 body-xsmall font-medium transition-colors shrink-0">
                    <FiPlus className="w-3 h-3" /> Add Need
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2 body-small font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" form="manual-log-form" disabled={isSubmitting} className="px-6 py-2 body-small font-semibold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 min-w-[80px]">
              {isSubmitting ? "Adding..." : "Add Log"}
            </button>
          </div>
        </div>
      </div>

      <SelectorDialog
        isOpen={isNeedsOpen}
        onClose={() => setIsNeedsOpen(false)}
        title="Select Needs"
        options={predefinedNeeds}
        selectedIds={selectedNeeds.map((n) => n.id)}
        onSelect={(id) => {
          if (selectedNeeds.find((n) => n.id === id)) removeNeed(id);
          else {
            const opt = predefinedNeeds.find((o) => o.id === id);
            if (opt) setSelectedNeeds((p) => [...p, opt]);
          }
        }}
        onAddCustom={(label) => setSelectedNeeds((p) => [...p, { id: `custom_${label}`, label }])}
      />

      <SelectorDialog
        isOpen={isChannelsOpen}
        onClose={() => setIsChannelsOpen(false)}
        title="Select Channels"
        options={PREDEFINED_CHANNELS}
        selectedIds={selectedChannels.map((c) => c.id)}
        onSelect={(id) => {
          if (selectedChannels.find((c) => c.id === id)) removeChannel(id);
          else {
            const opt = PREDEFINED_CHANNELS.find((o) => o.id === id);
            if (opt) setSelectedChannels((p) => [...p, opt]);
          }
        }}
        onAddCustom={(label) => setSelectedChannels((p) => [...p, { id: `custom_${label}`, label }])}
      />
    </>
  );
}
