'use client';

import { FiMapPin, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface LocationPanelProps {
  latitude: number | null;
  longitude: number | null;
}

export default function LocationPanel({ latitude, longitude }: LocationPanelProps) {
  const hasLocation = latitude !== null && longitude !== null;

  const copyLocation = () => {
    if (hasLocation) {
      navigator.clipboard.writeText(`${latitude}, ${longitude}`);
      toast.success('Location copied to clipboard');
    }
  };

  if (!hasLocation) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-foreground/40">
        <FiMapPin className="w-16 h-16 mb-lg opacity-50" />
        <p className="title-small font-medium text-foreground/60">No Location Available</p>
        <p className="body-small text-center mt-2 max-w-xs text-foreground/40">
          The resident has not shared their location.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Map Placeholder */}
      <div className="flex-1 relative bg-background-subtle overflow-hidden">
        {/* This placeholder is designed to be replaced with a real map provider (Leaflet, Google Maps, Mapbox) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center text-foreground/30">
            <FiMapPin className="w-12 h-12 mb-2" />
            <p className="body-medium font-medium">Interactive Map</p>
            <p className="body-xsmall mt-1">{latitude}, {longitude}</p>
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={copyLocation}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-background rounded-lg shadow-md text-foreground/70 hover:text-foreground body-xsmall font-medium transition-colors z-10"
        >
          <FiCopy className="w-3.5 h-3.5" />
          Copy Location
        </button>

        {/* Minimap */}
        <div className="absolute bottom-4 left-4 w-28 h-28 bg-background rounded-lg shadow-lg border-2 border-white overflow-hidden z-10">
          <div className="w-full h-full bg-info/10 flex items-center justify-center">
            <FiMapPin className="w-6 h-6 text-danger" />
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-lg py-sm bg-background border-t border-background-subtle shrink-0">
        <p className="body-xsmall text-foreground/50">
          <span className="font-semibold">Street View May Be Nearby:</span>{' '}
          The image shown is the closest available Street View location. The map pin shows the resident&apos;s exact location.
        </p>
      </div>
    </div>
  );
}
