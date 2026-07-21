"use client";

import { FiMapPin, FiCopy } from "react-icons/fi";
import { toast } from "react-hot-toast";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./InteractiveLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden relative">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-white z-10">
        <div className="w-[200px] h-8 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="w-[120px] h-8 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0 flex items-center gap-3">
        <div className="w-[100px] h-4 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="w-[150px] h-8 bg-gray-200 animate-pulse rounded-full"></div>
        <div className="w-[150px] h-8 bg-gray-200 animate-pulse rounded-full"></div>
      </div>
      <div className="flex-1 bg-gray-200 animate-pulse min-h-[400px]"></div>
    </div>
  ),
});

interface LocationPanelProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  channels?: string[];
}

export default function LocationPanel({
  latitude,
  longitude,
  channels,
}: LocationPanelProps) {
  // Coerce to numbers to handle potential stringified Decimals from the database
  const parsedLat = Number(latitude);
  const parsedLng = Number(longitude);

  const hasLocation =
    latitude !== null &&
    longitude !== null &&
    latitude !== undefined &&
    longitude !== undefined &&
    !isNaN(parsedLat) &&
    !isNaN(parsedLng) &&
    isFinite(parsedLat) &&
    isFinite(parsedLng);

  if (!hasLocation) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-foreground/40 p-6">
        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
          <FiMapPin className="w-8 h-8 opacity-50" />
        </div>
        <p className="title-medium font-semibold text-foreground/80">
          Location Unavailable
        </p>
        <p className="body-small text-center mt-2 text-foreground/60">
          The resident has not granted location permissions or their device
          could not determine the location. <br />
          Ask the resident to provide their address manually.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-[500px]">
      <MapComponent
        latitude={parsedLat}
        longitude={parsedLng}
        channels={channels}
      />
    </div>
  );
}
