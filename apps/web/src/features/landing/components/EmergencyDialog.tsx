"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiMessageSquare, FiPhoneCall, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { logsApi } from "@/features/logs/api/logs.api";

export interface EmergencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyDialog({ isOpen, onClose }: EmergencyDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [showMessengerModal, setShowMessengerModal] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({
    isMessenger: false,
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      setBrowserInfo({
        isMessenger: /FBAN|FBAV|Instagram|FB_IAB|FB4A|IG_CPA|IG_CBA/i.test(ua),
        isIOS: /iPhone|iPad|iPod/i.test(ua),
        isAndroid: /Android/i.test(ua),
      });
    }
  }, []);

  const locationStateRef = useRef<{
    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
    locationTimestamp?: Date;
    locationStatus: string;
  }>({ locationStatus: "pending" });

  useEffect(() => {
    if (isOpen && "geolocation" in navigator) {
      navigator.permissions
        ?.query({ name: "geolocation" })
        .then((res) => {
          setPermissionStatus(res.state);
        })
        .catch(() => {});

      locationStateRef.current = { locationStatus: "pending" };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationStateRef.current = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationAccuracy: position.coords.accuracy,
            locationTimestamp: new Date(position.timestamp),
            locationStatus: "success",
          };
        },
        (error) => {
          let status = "unavailable";
          if (error.code === error.PERMISSION_DENIED) status = "denied";
          else if (error.code === error.TIMEOUT) status = "timeout";
          locationStateRef.current = { locationStatus: status };
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      );
    } else if (isOpen) {
      locationStateRef.current = { locationStatus: "services unavailable" };
      setPermissionStatus("denied");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const handleAction = async (method: "voice" | "chat") => {
    if (
      method === "voice" &&
      browserInfo.isMessenger &&
      browserInfo.isAndroid
    ) {
      setShowMessengerModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await logsApi.createEmergency({
        communicationMethod: method,
        ...locationStateRef.current,
      });

      if (data && data.id) {
        router.push(`/sos/${data.id}`);
        onClose();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg =
        error.message ||
        "Failed to connect to emergency services. Please call 911 directly if possible.";
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };

  const handleAndroidProceed = async () => {
    setIsSubmitting(true);
    setShowMessengerModal(false);

    try {
      const data = await logsApi.createEmergency({
        communicationMethod: "voice",
        ...locationStateRef.current,
      });

      if (data && data.id) {
        const host = window.location.host;
        const path = `/sos/${data.id}`;
        const intentUrl = `intent://${host}${path}#Intent;scheme=https;end;`;
        window.location.href = intentUrl;

        // Fallback if intent fails
        setTimeout(() => {
          router.push(path);
          onClose();
        }, 1000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg =
        error.message ||
        "Failed to connect to emergency services. Please call 911 directly if possible.";
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div
          ref={dialogRef}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[540px] overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-dialog-title"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-white px-8 pt-10 pb-6 border-b border-gray-100/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-danger border-2 border-white shadow-sm"></span>
                </div>
                <h2
                  id="emergency-dialog-title"
                  className="text-2xl font-bold text-gray-900 tracking-tight"
                >
                  Request Assistance
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 -mt-2 -mr-2"
                aria-label="Close dialog"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-base text-gray-500 relative z-10 pl-7">
              {isSubmitting
                ? "Connecting to emergency services..."
                : "How would you like to communicate with an emergency coordinator?"}
            </p>
          </div>

          <div className="px-8 py-8 bg-white/50 backdrop-blur-sm">
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
            >
              <button
                onClick={() => handleAction("chat")}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-primary/[0.02] hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300 mb-5 shadow-sm">
                  <FiMessageSquare className="w-7 h-7 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">
                  Live Chat
                </h3>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  Text silently with a coordinator
                </p>
              </button>

              <button
                onClick={() => handleAction("voice")}
                disabled={
                  isSubmitting || (browserInfo.isMessenger && browserInfo.isIOS)
                }
                className={`flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-2xl transition-all duration-300 group ${
                  browserInfo.isMessenger && browserInfo.isIOS
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-danger hover:bg-danger/[0.02] hover:shadow-lg"
                }`}
              >
                <div
                  className={`w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5 shadow-sm transition-all duration-300 ${
                    browserInfo.isMessenger && browserInfo.isIOS
                      ? ""
                      : "group-hover:bg-danger/10 group-hover:scale-105"
                  }`}
                >
                  <FiPhoneCall
                    className={`w-7 h-7 text-gray-400 transition-colors ${
                      browserInfo.isMessenger && browserInfo.isIOS
                        ? ""
                        : "group-hover:text-danger"
                    }`}
                  />
                </div>
                <h3
                  className={`text-lg font-bold text-gray-900 mb-2 transition-colors ${
                    browserInfo.isMessenger && browserInfo.isIOS
                      ? ""
                      : "group-hover:text-danger"
                  }`}
                >
                  Voice Call
                </h3>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  Speak directly with a coordinator
                </p>

                {browserInfo.isMessenger && browserInfo.isIOS && (
                  <div className="mt-4 bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200 leading-tight">
                    Voice calls are unavailable in Messenger's browser. To use
                    voice communication, tap the three dots (...) or share icon
                    in your Messenger toolbar and select 'Open in Safari'.
                  </div>
                )}
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              {permissionStatus && permissionStatus !== "granted" && (
                <p className="text-xs text-gray-400 text-center">
                  For the fastest emergency response, we recommend allowing
                  location access.
                </p>
              )}
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors hover:underline disabled:opacity-50 px-4 py-2 rounded-lg"
              >
                Cancel Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMessengerModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-white/20 animate-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Browser Restriction
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                It seems like your current app or browser does not fully support
                the camera and microphone permissions required for voice calls.
                Proceed to open this link in your device's default system
                browser to continue.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowMessengerModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAndroidProceed}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Opening..." : "Proceed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
