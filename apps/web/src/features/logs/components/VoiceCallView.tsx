"use client";

import {
  FiMic,
  FiPhoneOff,
  FiPhone,
  FiMicOff,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";
import { Call } from "../types/logs.types";
import { CALL_STATUS_CONFIG } from "../constants/logs.constants";
import { Socket } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { useWebRTC } from "@/lib/webrtc";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface VoiceCallViewProps {
  call: Call | null;
  logId: string;
  socket?: Socket;
}

function formatDuration(startTime: string | null, endedAt: string | null): string {
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

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { startCall, endCall, toggleMute, remoteStream } = useWebRTC(
    socket,
    logId,
    "coordinator",
  );

  useEffect(() => {
    if (call?.status === "active") {
      startCall();
    }

    if (socket) {
      const onCallEnded = (payload: any) => {
        endCall();
        if (payload?.endedBy === "resident") {
          toast("The resident ended the call.", { icon: "📞" });
        } else if (payload?.endedBy === "system") {
          toast("The call was ended by the system.", { icon: "⚠️" });
        }
      };
      socket.on("call_ended", onCallEnded);
      return () => {
        socket.off("call_ended", onCallEnded);
        endCall();
      };
    }

    return () => {
      endCall();
    };
  }, [call?.status, socket]);

  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
  const isMissed = call.status === "missed";
  const isActive = call.status === "active" || call.status === "ringing";
  const isEnded = call.status === "ended" || call.status === "rejected";

  const handleEndCall = () => {
    if (socket) {
      socket.emit("end_call", { callId: call.id });
    }
    endCall();
  };

  const handleToggleMute = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-background-subtle">
      <audio ref={audioRef} autoPlay />
      <div className="px-lg py-sm border-b border-background-subtle shrink-0">
        <p className="body-small text-foreground/50">
          {prefix}: {sourceLabel}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Avatar */}
        <div
          className={`w-28 h-28 rounded-full flex items-center justify-center ${
            isMissed
              ? "bg-warning/10 ring-4 ring-warning/30"
              : isActive
                ? "bg-success/10 ring-4 ring-success/30 animate-pulse"
                : "bg-danger/10"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${isActive ? "bg-success/20" : "bg-danger/20"}`}
          >
            <span className="text-4xl">🏃</span>
          </div>
        </div>

        <p className="title-small font-bold text-foreground">Resident</p>

        {(isEnded || isMissed) && (
          <p className={`body-medium font-medium ${statusConfig.colorClass}`}>
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

      {/* Call Controls (only when active) */}
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
            className="w-14 h-14 rounded-full bg-danger flex items-center justify-center hover:bg-danger-hover transition-colors shadow-lg z-10"
          >
            <FiPhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
