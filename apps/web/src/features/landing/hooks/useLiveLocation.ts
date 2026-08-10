import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
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
  isActive: boolean,
) => {
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !callId || !isActive || !("geolocation" in navigator))
      return;

    let isTracking = true;

    const startTracking = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!isTracking) return;

          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          // Ignore completely useless readings (> 2000 meters)
          if (accuracy > 2000) return;

          if (lastLocationRef.current) {
            const dist = getDistanceInMeters(
              lastLocationRef.current.lat,
              lastLocationRef.current.lng,
              lat,
              lng,
            );

            // Ignore jitter (movements less than 5 meters)
            if (dist < 5) return;
          }

          lastLocationRef.current = { lat, lng };
          socket.emit("update_location", {
            callId,
            latitude: lat,
            longitude: lng,
          });
        },
        (err) => {
          console.warn("Live location watch error:", err);
          // Intelligent retry if it's not a hard denial (e.g., timeout or generic error)
          if (err.code !== err.PERMISSION_DENIED && isTracking) {
            retryTimeoutRef.current = setTimeout(() => {
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
              }
              startTracking();
            }, 10000);
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
      );
    };

    // Send an immediate single position to ensure the coordinator gets the absolute latest
    // right when the session starts (in case they moved while connecting)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isTracking) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        lastLocationRef.current = { lat, lng };
        socket.emit("update_location", {
          callId,
          latitude: lat,
          longitude: lng,
        });
      },
      (err) => console.warn("Initial live location error:", err),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 },
    );

    startTracking();

    return () => {
      isTracking = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [socket, callId, isActive]);
};
