"use client";

import {
  FiMic,
  FiPhoneOff,
  FiPhone,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiUser,
  FiAlertTriangle,
} from "react-icons/fi";
import { Call } from "../types/logs.types";
import { CALL_STATUS_CONFIG } from "../constants/logs.constants";
import { Socket } from "socket.io-client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useIncomingCall } from "@/providers/IncomingCallProvider";

interface VoiceCallViewProps {
  call: Call | null;
  logId: string;
  socket?: Socket;
}

function formatDuration(
  startTime: string | null,
  endedAt: string | null,
): string {
  if (!startTime) return "0:00";
  const start = new Date(startTime).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VoiceCallView({
  call,
  logId,
  socket,
}: VoiceCallViewProps) {
  const sourceLabel =
    call?.communication_method === "voice" ? "Voice Call" : "In-app Call";
  const prefix = call?.status === "missed" ? "From" : "Source";

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { webrtc } = useIncomingCall();
  const {
    startCall,
    endCall,
    toggleMute,
    isMuted,
    remoteStream,
    hasRemoteVideo,
  } = webrtc || {};

  useEffect(() => {
    if (call?.status === "active" && startCall) {
      startCall();
    }

    if (socket) {
      const onCallEnded = (payload: any) => {
        if (endCall) endCall();
        if (payload?.endedBy === "resident") {
          toast("The resident ended the call.", {
            icon: <FiPhoneOff className="text-danger" />,
            id: "resident-ended",
          });
        } else if (payload?.endedBy === "system") {
          toast("The call was ended by the system.", {
            icon: <FiAlertTriangle className="text-warning" />,
            id: "system-ended",
          });
        }
      };
      socket.on("call_ended", onCallEnded);
      return () => {
        socket.off("call_ended", onCallEnded);
      };
    }
  }, [call?.status, socket, startCall, endCall]);

  const videoCallbackRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node) {
        if (remoteStream) {
          node.srcObject = null;
          node.srcObject = remoteStream;
          node.play().catch((e) => console.log("Video play error:", e));
        } else {
          node.srcObject = null;
        }
      }
    },
    [remoteStream],
  );

  const isActive = call?.status === "active" || call?.status === "ringing";
  const isMissed = call?.status === "missed";
  const isEnded = call?.status === "ended" || call?.status === "rejected";
  const showVideo = hasRemoteVideo && isActive;

  if (!call) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-foreground/40 border-r border-background-subtle">
        <FiPhone className="w-16 h-16 mb-lg opacity-50" />
        <p className="title-small font-medium text-foreground/60">
          No Call Data
        </p>
        <p className="body-small text-center mt-2 max-w-xs text-foreground/40">
          No voice call information available for this log.
        </p>
      </div>
    );
  }

  const statusConfig = CALL_STATUS_CONFIG[call.status] || {
    label: call.status,
    colorClass: "text-foreground",
  };

  const handleEndCall = () => {
    if (socket) {
      socket.emit("end_call", { callId: call.id });
    }
    if (endCall) endCall();
  };

  const handleToggleMute = () => {
    if (toggleMute) toggleMute();
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-background-subtle">
      <div className="px-lg py-sm border-b border-background-subtle shrink-0">
        <p className="body-small text-foreground/50">
          {prefix}: {sourceLabel}
        </p>
      </div>

      {!showVideo ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div
              className={`w-40 h-40 rounded-full flex items-center justify-center relative ${
                isMissed
                  ? "bg-warning/10 ring-4 ring-warning/30"
                  : isActive
                    ? "bg-success/10 ring-4 ring-success/30 animate-pulse"
                    : "bg-danger/10"
              }`}
            >
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center ${isActive ? "bg-success/20" : "bg-danger/20"}`}
              >
                <FiUser
                  className={`w-14 h-14 ${isActive ? "text-success" : "text-danger"}`}
                />
              </div>
            </div>

            <p className="title-small font-bold text-foreground">Resident</p>

            {(isEnded || isMissed) && (
              <p
                className={`body-medium font-medium ${statusConfig.colorClass}`}
              >
                {statusConfig.label}
              </p>
            )}

            {isActive && (
              <p className="body-medium font-medium text-success animate-pulse">
                {call.status === "ringing" ? "Ringing..." : "Active Call"}
              </p>
            )}

            {(isActive || isEnded) && (
              <p className="body-medium text-foreground/70">
                {formatDuration(call.answered_at, call.ended_at)}
              </p>
            )}
          </div>

          {isActive && (
            <div className="flex items-center justify-center gap-xl py-xl border-t border-background-subtle shrink-0">
              <button
                onClick={handleToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? "bg-danger/10 text-danger"
                    : "bg-background-subtle text-foreground hover:bg-foreground/10"
                }`}
              >
                {isMuted ? (
                  <FiMicOff className="w-5 h-5" />
                ) : (
                  <FiMic className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-danger flex items-center justify-center hover:bg-danger-hover transition-colors shadow-lg z-10 transform"
              >
                <FiPhone className="w-6 h-6 text-white rotate-[135deg]" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 relative overflow-hidden bg-black flex flex-col">
          <video
            ref={videoCallbackRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute top-4 left-4 right-4 flex items-center justify-between p-3 bg-background/60 backdrop-blur-xl rounded-2xl z-10 shadow-lg border border-white/10">
            <div className="flex items-center gap-3">
              {/* Resident Avatar */}
              <div className="w-11 h-11 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <FiUser className="w-6 h-6 text-success" />
              </div>
              <div className="flex flex-col">
                <p className="body-medium font-bold text-foreground">
                  Resident
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <p className="text-xs font-medium text-success">
                    Active Call
                  </p>
                  <span className="text-foreground/40 text-[10px]">•</span>
                  <p className="text-xs font-mono text-foreground/80">
                    {formatDuration(call.answered_at, call.ended_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isMuted
                    ? "bg-danger/90 text-white"
                    : "bg-background/80 text-foreground hover:bg-background"
                }`}
              >
                {isMuted ? (
                  <FiMicOff className="w-5 h-5" />
                ) : (
                  <FiMic className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleEndCall}
                className="w-11 h-11 rounded-full bg-danger flex items-center justify-center hover:bg-danger-hover transition-colors shadow-sm transform"
              >
                <FiPhone className="w-5 h-5 text-white rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
