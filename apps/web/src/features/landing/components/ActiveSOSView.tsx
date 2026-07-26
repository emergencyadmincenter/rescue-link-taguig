"use client";

import React, { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import {
  FiX,
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiCheck,
  FiPhone,
  FiRefreshCw,
  FiMapPin,
} from "react-icons/fi";
import { useWebRTC } from "@/lib/webrtc";
import { useLiveLocation } from "../hooks/useLiveLocation";

interface ActiveSOSViewProps {
  callId: string;
  callData: any;
  socket: Socket;
}

export default function ActiveSOSView({
  callId,
  callData,
  socket,
}: ActiveSOSViewProps) {
  const [isMuted, setIsMuted] = React.useState(false);
  const [sessionEndReason, setSessionEndReason] = React.useState<
    "resident" | "coordinator" | "system" | null
  >(null);
  const [isRetryingLocation, setIsRetryingLocation] = React.useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useLiveLocation(socket, callId, !sessionEndReason);

  const {
    startCall,
    endCall,
    toggleMute,
    remoteStream,
    localStream,
    toggleVideo,
    switchCamera,
    isVideoEnabled,
    facingMode,
  } = useWebRTC(socket, callId, "resident");

  useEffect(() => {
    // Start WebRTC connection when accepted
    startCall();

    // Listen for call ended event
    const onCallEnded = (payload: any) => {
      endCall();
      if (payload?.endedBy === "coordinator") {
        setSessionEndReason("coordinator");
      } else if (payload?.endedBy === "system") {
        setSessionEndReason("system");
      }
    };

    socket.on("call_ended", onCallEnded);

    return () => {
      endCall();
      socket.off("call_ended", onCallEnded);
    };
  }, []);

  useEffect(() => {
    if (sessionEndReason) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionEndReason]);

  useEffect(() => {
    if (audioRef.current) {
      if (remoteStream) {
        audioRef.current.srcObject = null;
        audioRef.current.srcObject = remoteStream;
      } else {
        audioRef.current.srcObject = null;
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (videoRef.current) {
      if (localStream && isVideoEnabled) {
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = localStream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [localStream, isVideoEnabled]);

  const handleEndCall = () => {
    socket.emit("end_call", { callId: callData.callId });
    endCall();
    setSessionEndReason("resident");
  };

  const handleToggleMute = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const handleRetryLocation = () => {
    setIsRetryingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { logsApi } = await import("@/features/logs/api/logs.api");
          await logsApi.updateLocation(callId, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationAccuracy: position.coords.accuracy,
            locationTimestamp: new Date(position.timestamp),
            locationStatus: "success",
          });
          import("react-hot-toast").then((m) =>
            m.default.success("Location updated successfully."),
          );
        } catch (err) {
          import("react-hot-toast").then((m) =>
            m.default.error("Failed to update location."),
          );
        } finally {
          setIsRetryingLocation(false);
        }
      },
      async (error) => {
        let status = "unavailable";
        if (error.code === error.PERMISSION_DENIED) status = "denied";
        else if (error.code === error.TIMEOUT) status = "timeout";

        try {
          const { logsApi } = await import("@/features/logs/api/logs.api");
          await logsApi.updateLocation(callId, {
            locationStatus: status,
          });
        } catch (err) {}

        import("react-hot-toast").then((m) =>
          m.default.error(
            "Could not acquire location. Please check permissions.",
          ),
        );
        setIsRetryingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  if (sessionEndReason) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-[70vw] md:max-w-[50vw] w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FiCheck className="w-10 h-10 text-gray-500" />
          </div>
          <h1 className="title-medium text-gray-900 mb-2">Session Ended</h1>
          <p className="body-medium text-gray-500 mb-8">
            {sessionEndReason === "coordinator"
              ? "The coordinator has ended the emergency session."
              : sessionEndReason === "system"
                ? "The emergency session was ended by the system."
                : "You have ended the emergency session."}
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors mb-3"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden animate-in fade-in">
      <audio key={callId} ref={audioRef} autoPlay />

      {/* Main Video Area (Resident Camera Fullscreen) */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        {isVideoEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <FiVideoOff className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/50 text-sm">Camera is disabled</p>
          </div>
        )}
      </div>

      {/* Floating Header Overlay */}
      <div className="absolute top-4 sm:top-6 left-4 right-4 sm:left-6 sm:right-6 z-10 flex items-center justify-between p-3 sm:p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 relative">
            <span className="text-white font-bold text-sm sm:text-base">
              CC
            </span>
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-black" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm sm:text-base">
              Command Center
            </h3>
            <p className="text-white/70 text-xs sm:text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              Connected
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-white/80 text-xs sm:text-sm font-mono bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
            {callId.slice(0, 8)}
          </div>
          <button
            onClick={handleRetryLocation}
            disabled={isRetryingLocation}
            className="text-white/80 text-xs sm:text-sm bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner flex items-center gap-1.5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <FiMapPin
              className={`w-3.5 h-3.5 ${isRetryingLocation ? "animate-spin" : ""}`}
            />
            Retry Location
          </button>
        </div>
      </div>

      {/* Camera Switch Button */}
      {isVideoEnabled && (
        <button
          onClick={switchCamera}
          className="absolute top-32 lg:top-42 right-4 sm:right-6 z-20 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 backdrop-blur-md border border-white/10 shadow-lg transition-transform active:scale-95"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 p-6 pb-8 flex justify-center items-center gap-4 sm:gap-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
        <button
          onClick={toggleVideo}
          className={`p-4 sm:p-5 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md ${isVideoEnabled ? "bg-white/15 text-white hover:bg-white/25 border border-white/10" : "bg-danger text-white hover:bg-danger-hover"}`}
        >
          {isVideoEnabled ? (
            <FiVideo className="w-6 h-6" />
          ) : (
            <FiVideoOff className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={handleToggleMute}
          className={`p-4 sm:p-5 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md ${!isMuted ? "bg-white/15 text-white hover:bg-white/25 border border-white/10" : "bg-danger text-white hover:bg-danger-hover"}`}
        >
          {!isMuted ? (
            <FiMic className="w-6 h-6" />
          ) : (
            <FiMicOff className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="p-4 sm:p-5 rounded-full bg-danger text-white hover:bg-danger-hover transition-all duration-300 shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] ml-2 sm:ml-4"
        >
          <FiPhone className="w-6 h-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
