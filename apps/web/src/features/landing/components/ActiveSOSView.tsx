"use client";

import React, { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import {
  FiX,
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMessageSquare,
  FiCheck,
  FiPhone,
  FiRefreshCw,
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
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [sessionEndReason, setSessionEndReason] = React.useState<
    "resident" | "coordinator" | "system" | null
  >(null);

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
    <div className="min-h-screen bg-black flex flex-col animate-in fade-in">
      <audio key={callId} ref={audioRef} autoPlay />

      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-white text-sm font-medium">
            Active Emergency Call
          </span>
        </div>
        <span className="text-white/60 text-sm font-mono">
          {callId.slice(0, 8)}
        </span>
      </div>

      {/* Main Video/Audio Area */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-16">
          <div className="w-24 h-24 rounded-full bg-white/20 animate-pulse flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)]">
            <span className="text-white text-3xl font-bold">CC</span>
          </div>
        </div>

        {/* Local Video PIP */}
        {isVideoEnabled && (
          <div className="absolute bottom-32 right-4 w-28 h-40 bg-black rounded-xl overflow-hidden shadow-lg border border-white/20 z-20">
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
            <button
              onClick={switchCamera}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Floating Chat Overlay (if open) */}
        {isChatOpen && (
          <div className="absolute inset-x-4 bottom-32 top-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-white/20 flex justify-between items-center bg-black/40">
              <span className="text-white font-medium text-sm">
                Emergency Chat
              </span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-white/50 text-xs text-center">Chat started</p>
              {/* Chat messages would go here */}
            </div>
            <div className="p-3 bg-black/40">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-white/10 text-white rounded-full px-4 py-2 text-sm outline-none placeholder:text-white/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 pb-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-4 rounded-full transition-colors ${isChatOpen ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          <FiMessageSquare className="w-6 h-6" />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${isVideoEnabled ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          {isVideoEnabled ? (
            <FiVideo className="w-6 h-6" />
          ) : (
            <FiVideoOff className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={handleToggleMute}
          className={`p-4 rounded-full transition-colors ${!isMuted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          {!isMuted ? (
            <FiMic className="w-6 h-6" />
          ) : (
            <FiMicOff className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-danger text-white hover:bg-danger-hover transition-colors shadow-lg"
        >
          <FiPhone className="w-6 h-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
