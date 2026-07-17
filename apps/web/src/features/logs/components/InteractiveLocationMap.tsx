"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiMapPin,
  FiX,
  FiNavigation,
  FiPhone,
  FiClock,
  FiMap,
  FiTarget,
  FiAlertCircle,
  FiTruck,
  FiShield,
  FiActivity,
  FiHome,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

// --- Leaflet Icon Fixes ---
const residentIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: "resident-marker",
});

const facilityIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: "facility-marker",
});

// --- Types ---
type FacilityType =
  "Fire Station" | "Hospital" | "Police Station" | "Evacuation Center";

interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  contact: string;
  lat: number;
  lng: number;
  distance: number;
  travelTime: number;
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

interface InteractiveLocationMapProps {
  latitude: number;
  longitude: number;
}

// --- Helper Components ---
const MapBoundsFitter = ({
  residentLat,
  residentLng,
  facilityLat,
  facilityLng,
}: {
  residentLat: number;
  residentLng: number;
  facilityLat: number;
  facilityLng: number;
}) => {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([
      [residentLat, residentLng],
      [facilityLat, facilityLng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }, [map, residentLat, residentLng, facilityLat, facilityLng]);
  return null;
};

// Component to handle View mode changes and resizing
const MapViewSync = ({
  isStreetViewActive,
}: {
  isStreetViewActive: boolean;
}) => {
  const map = useMap();
  useEffect(() => {
    // When street view overlay toggles, the map might need a resize calculation
    setTimeout(() => map.invalidateSize(), 150);
  }, [isStreetViewActive, map]);
  return null;
};

// Component to add a native-feeling Pegman control to Leaflet
const StreetViewControl = ({
  hasStreetView,
  onEnter,
}: {
  hasStreetView: boolean;
  onEnter: () => void;
}) => {
  const map = useMap();
  useEffect(() => {
    if (!hasStreetView) return;

    const control = L.control({ position: "topleft" });
    control.onAdd = () => {
      const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const button = L.DomUtil.create("a", "", container);
      button.href = "#";
      button.title = "Enter Street View";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.width = "34px";
      button.style.height = "34px";
      button.style.backgroundColor = "#fff";
      button.style.color = "#333";
      button.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2C10.9 2 10 2.9 10 4s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm-1 5v7h2v-7h-2zm-3 2v2h2v-2H8zm8 0v2h2v-2h-2zm-5 7v4h2v-4h-2z" fill="currentColor"/></svg>`;

      L.DomEvent.on(button, "click", (e) => {
        L.DomEvent.preventDefault(e);
        onEnter();
      });
      return container;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, hasStreetView, onEnter]);
  return null;
};

// --- Mock Data Generator ---
const generateMockFacilities = (lat: number, lng: number): Facility[] => {
  const types: FacilityType[] = [
    "Fire Station",
    "Hospital",
    "Police Station",
    "Evacuation Center",
  ];
  const facilities: Facility[] = [];

  const names = {
    "Fire Station": "Taguig Central Fire Station",
    Hospital: "Taguig Pateros District Hospital",
    "Police Station": "Taguig Police Sub-Station",
    "Evacuation Center": "Hagonoy Evacuation Center",
  };

  types.forEach((type, index) => {
    const latOffset = (Math.random() - 0.5) * 0.03;
    const lngOffset = (Math.random() - 0.5) * 0.03;
    const fLat = lat + latOffset;
    const fLng = lng + lngOffset;

    const R = 6371;
    const dLat = ((fLat - lat) * Math.PI) / 180;
    const dLng = ((fLng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((fLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 5) {
      facilities.push({
        id: `fac-${index}`,
        name: names[type],
        type,
        address: `${Math.floor(Math.random() * 100) + 1} Main St, Taguig City`,
        contact: `+63 2 8${Math.floor(1000000 + Math.random() * 9000000)}`,
        lat: fLat,
        lng: fLng,
        distance,
        travelTime: (distance / 30) * 60,
      });
    }
  });

  return facilities.sort((a, b) => a.distance - b.distance);
};

export default function InteractiveLocationMap({
  latitude,
  longitude,
}: InteractiveLocationMapProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  );
  const [activeRoute, setActiveRoute] = useState<{
    facility: Facility;
    routeData: RouteData;
  } | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Street view states
  const [hasCheckedStreetView, setHasCheckedStreetView] = useState(false);
  const [hasStreetView, setHasStreetView] = useState(false);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);

  useEffect(() => {
    const found = generateMockFacilities(latitude, longitude);
    setFacilities(found);
  }, [latitude, longitude]);

  // Check if Street View is available without requiring an API key
  useEffect(() => {
    let isMounted = true;

    const checkPanorama = () => {
      if (!isMounted) return;
      if (
        (window as any).google &&
        (window as any).google.maps &&
        (window as any).google.maps.StreetViewService
      ) {
        const sv = new (window as any).google.maps.StreetViewService();
        sv.getPanorama(
          { location: { lat: latitude, lng: longitude }, radius: 50 },
          (data: any, status: string) => {
            if (!isMounted) return;
            if (status === "OK") {
              setHasStreetView(true);
              setIsStreetViewActive(true); // Default to true if available
            } else {
              setHasStreetView(false);
              setIsStreetViewActive(false);
            }
            setHasCheckedStreetView(true);
          },
        );
      } else {
        if (isMounted) setHasCheckedStreetView(true);
      }
    };

    if (
      (window as any).google &&
      (window as any).google.maps &&
      (window as any).google.maps.StreetViewService
    ) {
      checkPanorama();
    } else {
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]',
      );
      if (existingScript) {
        // Script is already in the document but might still be loading.
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (
            (window as any).google &&
            (window as any).google.maps &&
            (window as any).google.maps.StreetViewService
          ) {
            clearInterval(interval);
            checkPanorama();
          } else if (attempts > 50) {
            // 5 seconds timeout
            clearInterval(interval);
            if (isMounted) setHasCheckedStreetView(true);
          }
        }, 100);
      } else {
        const script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js?v=3.exp";
        script.async = true;
        script.defer = true;
        script.onload = checkPanorama;
        script.onerror = () => {
          if (isMounted) setHasCheckedStreetView(true);
        };
        document.body.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  const handlePreviewRoute = async (facility: Facility) => {
    setIsRouting(true);
    const url = `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${facility.lng},${facility.lat}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok" && data.routes.length > 0) {
        setActiveRoute({ facility, routeData: data.routes[0] });
        setSelectedFacility(null);
        // Automatically switch back to map if they preview a route while in SV
        setIsStreetViewActive(false);
      } else {
        toast.error("Unable to generate route");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to routing service");
    } finally {
      setIsRouting(false);
    }
  };

  const clearRoute = () => setActiveRoute(null);

  const getFacilityIcon = (type: FacilityType) => {
    switch (type) {
      case "Fire Station":
        return <FiAlertCircle className="w-4 h-4 text-danger" />;
      case "Hospital":
        return <FiActivity className="w-4 h-4 text-blue-500" />;
      case "Police Station":
        return <FiShield className="w-4 h-4 text-blue-700" />;
      case "Evacuation Center":
        return <FiHome className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden relative">
      {/* Action Bar (Top) */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-white z-10">
        <div className="flex flex-col">
          <h2 className="title-medium text-gray-900">Resident Location</h2>
          <p className="body-small text-gray-500">
            Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
        </div>
      </div>

      {/* Quick Actions (Nearby Facilities) */}
      {!isStreetViewActive && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0 flex items-center gap-3 overflow-x-auto custom-scrollbar z-10">
          <span className="body-xsmall font-semibold text-gray-500 whitespace-nowrap uppercase tracking-wide mr-2">
            Nearby Services:
          </span>
          {facilities.length === 0 ? (
            <span className="body-xsmall text-gray-400 italic">
              Scanning area...
            </span>
          ) : (
            facilities.map((fac) => (
              <button
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 whitespace-nowrap shadow-sm group"
              >
                {getFacilityIcon(fac.type)}
                <span className="body-xsmall font-medium text-gray-700 group-hover:text-primary">
                  {fac.type} ({fac.distance.toFixed(1)}km)
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Main Map Container */}
      <div className="flex-1 relative bg-gray-100 min-h-[400px]">
        <style>{`
          .facility-marker { filter: hue-rotate(150deg); }
          .route-line { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
        `}</style>

        {/* Leaflet Map is always rendered beneath to preserve loaded state */}
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          zoomControl={true}
          className="w-full h-full z-0 absolute inset-0"
        >
          <MapViewSync isStreetViewActive={isStreetViewActive} />
          <StreetViewControl
            hasStreetView={hasStreetView}
            onEnter={() => setIsStreetViewActive(true)}
          />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-map-tiles"
          />

          <Marker position={[latitude, longitude]} icon={residentIcon}>
            <Popup className="font-sans">
              <div className="text-center p-1">
                <p className="font-semibold text-gray-900 mb-1">
                  Resident Location
                </p>
                <p className="text-xs text-gray-500">SOS Origin Point</p>
              </div>
            </Popup>
          </Marker>

          {activeRoute && (
            <>
              <Marker
                position={[activeRoute.facility.lat, activeRoute.facility.lng]}
                icon={facilityIcon}
              >
                <Popup className="font-sans">
                  <div className="p-1">
                    <p className="font-semibold text-gray-900">
                      {activeRoute.facility.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activeRoute.facility.type}
                    </p>
                  </div>
                </Popup>
              </Marker>
              <Polyline
                positions={activeRoute.routeData.geometry.coordinates.map(
                  (c) => [c[1], c[0]],
                )}
                pathOptions={{
                  color: "#3b82f6",
                  weight: 5,
                  opacity: 0.8,
                  className: "route-line",
                }}
              />
              <MapBoundsFitter
                residentLat={latitude}
                residentLng={longitude}
                facilityLat={activeRoute.facility.lat}
                facilityLng={activeRoute.facility.lng}
              />
            </>
          )}
        </MapContainer>

        {/* Immersive Street View Overlay inside the map boundary */}
        {isStreetViewActive && hasStreetView && (
          <div className="absolute inset-0 z-[2000] bg-gray-100 flex flex-col">
            <div className="absolute top-20 left-0 z-[2010]">
              <button
                onClick={() => setIsStreetViewActive(false)}
                className="flex items-center gap-2 bg-black/70 hover:bg-black text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-md transition-all duration-200 body-xsmall font-medium group"
                title="Return to Map View"
              >
                <svg
                  className="w-5 h-5 text-white/80 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Map
              </button>
            </div>
            <iframe
              src={`https://maps.google.com/maps?layer=c&cbll=${latitude},${longitude}&cbp=11,0,0,0,0&output=svembed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Interactive Street View"
            />
          </div>
        )}

        {/* Floating Route Info Panel */}
        {activeRoute && !isStreetViewActive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 flex items-center gap-6 z-[1000] animate-fade-in">
            <div className="flex flex-col">
              <p className="body-xsmall font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Route to {activeRoute.facility.type}
              </p>
              <h3 className="body-medium font-bold text-gray-900">
                {activeRoute.facility.name}
              </h3>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="body-xsmall text-gray-500 flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" /> Distance
                </span>
                <span className="body-medium font-semibold text-gray-900">
                  {(activeRoute.routeData.distance / 1000).toFixed(1)} km
                </span>
              </div>
              <div className="flex flex-col">
                <span className="body-xsmall text-gray-500 flex items-center gap-1">
                  <FiClock className="w-3 h-3" /> Est. Time
                </span>
                <span className="body-medium font-semibold text-gray-900">
                  {Math.round(activeRoute.routeData.duration / 60)} mins
                </span>
              </div>
            </div>
            <button
              onClick={clearRoute}
              className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-400 hover:text-gray-700" />
            </button>
          </div>
        )}

        {/* Floating Facility Dialog */}
        {selectedFacility && !isStreetViewActive && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[1000] animate-fade-in flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-start justify-between bg-gray-50">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {getFacilityIcon(selectedFacility.type)}
                  <span className="body-xsmall font-semibold text-gray-600 uppercase">
                    {selectedFacility.type}
                  </span>
                </div>
                <h3 className="title-small text-gray-900 leading-tight">
                  {selectedFacility.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors shrink-0"
              >
                <FiX className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4 bg-white">
              <div className="flex flex-col gap-2">
                <p className="body-small text-gray-600 flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <span>{selectedFacility.address}</span>
                </p>
                <p className="body-small text-gray-600 flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{selectedFacility.contact}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="body-xsmall text-gray-500">Distance</span>
                  <span className="body-small font-semibold text-gray-900">
                    {selectedFacility.distance.toFixed(1)} km
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="body-xsmall text-gray-500">Travel Time</span>
                  <span className="body-small font-semibold text-gray-900">
                    ~{Math.round(selectedFacility.travelTime)} mins
                  </span>
                </div>
              </div>
              <div className="h-32 w-full rounded-lg border border-gray-200 overflow-hidden relative">
                <MapContainer
                  center={[selectedFacility.lat, selectedFacility.lng]}
                  zoom={16}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="dark-map-tiles"
                  />
                  <Marker
                    position={[selectedFacility.lat, selectedFacility.lng]}
                    icon={facilityIcon}
                  />
                </MapContainer>
              </div>
              <button
                onClick={() => handlePreviewRoute(selectedFacility)}
                disabled={isRouting}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg body-small font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isRouting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiNavigation className="w-4 h-4" />
                )}
                {isRouting ? "Calculating Route..." : "Preview Route"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
