"use client";

import React, { useEffect, useState } from "react";
import { FiMapPin, FiX } from "react-icons/fi";

export function LocationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [permissionState, setPermissionState] =
    useState<PermissionState | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isVisible) {
      timeout = setTimeout(() => {
        setAnimateIn(true);
      }, 2000);
    } else {
      setAnimateIn(false);
    }
    return () => clearTimeout(timeout);
  }, [isVisible]);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!("permissions" in navigator)) return;

        const result = await navigator.permissions.query({
          name: "geolocation",
        });
        setPermissionState(result.state);

        result.addEventListener("change", () => {
          setPermissionState(result.state);
        });

        // If it's not granted, and user hasn't dismissed it recently, show the banner
        if (result.state !== "granted") {
          const dismissed = localStorage.getItem("location_banner_dismissed");
          if (!dismissed) {
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.warn("Permission query not supported", err);
      }
    };

    checkPermission();
  }, []);

  // Update visibility if permission is granted externally
  useEffect(() => {
    if (permissionState === "granted") {
      setIsVisible(false);
      // Clear the dismissal flag so if they deny it later, we can prompt again
      localStorage.removeItem("location_banner_dismissed");
    }
  }, [permissionState]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("location_banner_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-3 sm:px-6 lg:px-8 shadow-md transition-transform duration-700 ease-out ${
        animateIn ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-start sm:items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-start sm:items-center gap-3 flex-1">
          <span className="flex p-2 rounded-lg bg-primary-foreground/20 shrink-0 mt-1 sm:mt-0">
            <FiMapPin
              className="h-5 w-5 text-primary-foreground"
              aria-hidden="true"
            />
          </span>
          <p className="font-medium text-sm sm:text-base leading-snug pt-1 sm:pt-0">
            <span>
              For faster emergency response, please ensure Location Services are
              turned on in your device settings when prompted.
            </span>
          </p>
        </div>
        <div className="flex-shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            className="-mr-1 flex p-2 rounded-md hover:bg-primary-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-foreground sm:-mr-2 transition-colors"
            onClick={handleDismiss}
          >
            <span className="sr-only">Dismiss</span>
            <FiX
              className="h-5 w-5 text-primary-foreground/90"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
