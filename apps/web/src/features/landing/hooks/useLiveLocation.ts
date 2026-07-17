import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLiveLocation = (
  socket: Socket | null,
  callId: string,
  isActive: boolean
) => {
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!socket || !callId || !isActive || !("geolocation" in navigator)) return;

    let isTracking = true;

    // Send an immediate single position to ensure the coordinator gets the absolute latest
    // right when the session starts (in case they moved while connecting)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isTracking) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        lastLocationRef.current = { lat, lng };
        socket.emit("update_location", { callId, latitude: lat, longitude: lng });
      },
      (err) => console.warn("Initial live location error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isTracking) return;
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Ignore highly inaccurate readings (> 50 meters)
        if (accuracy > 50) return;

        if (lastLocationRef.current) {
          const dist = getDistanceInMeters(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            lat,
            lng
          );

          // Ignore jitter (movements less than 5 meters)
          if (dist < 5) return;
        }

        lastLocationRef.current = { lat, lng };
        socket.emit("update_location", { callId, latitude: lat, longitude: lng });
      },
      (err) => console.warn("Live location watch error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      isTracking = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, callId, isActive]);
};
