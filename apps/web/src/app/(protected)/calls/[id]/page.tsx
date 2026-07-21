"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiPhoneCall, FiMessageSquare } from "react-icons/fi";
import { useIncomingCall } from "@/providers/IncomingCallProvider";
import { logsApi } from "@/features/logs/api/logs.api";
import { Log, Resource, Call } from "@/features/logs/types/logs.types";
import IncidentFormPanel from "@/features/logs/components/IncidentFormPanel";
import CommunicationPanel from "@/features/logs/components/CommunicationPanel";
import LocationPanel from "@/features/logs/components/LocationPanel";
import toast from "react-hot-toast";

export default function CallSessionPage() {
  const params = useParams();
  const callId = params?.id as string;
  const router = useRouter();
  const { socket } = useIncomingCall() || {};
  const [log, setLog] = useState<Log | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "location">("details");

  useEffect(() => {
    if (!callId) return;

    logsApi
      .getCallDetails(callId)
      .then((data) => {
        setCall(data.call);
        setLog(data.log);
        return logsApi.getResources();
      })
      .then(setResources)
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load call session");
        router.push("/logs");
      })
      .finally(() => setLoading(false));
  }, [callId, router]);

  useEffect(() => {
    if (!socket || !callId) return;
    socket.emit("join_call_room", callId, (res: any) => {
      if (res && res.success === false) {
        toast.error(`Failed to join call room: ${res.error}`);
      }
    });

    const onCallEnded = () => {
      logsApi.getCallDetails(callId).then((data) => {
        setCall(data.call);
        setLog(data.log);
      });
    };

    socket.on("call_ended", onCallEnded);

    const onLocationUpdated = (data: {
      latitude: number;
      longitude: number;
    }) => {
      setLog((prev) => {
        if (!prev) return prev;
        return { ...prev, latitude: data.latitude, longitude: data.longitude };
      });
    };
    socket.on("location_updated", onLocationUpdated);

    return () => {
      socket.off("call_ended", onCallEnded);
      socket.off("location_updated", onLocationUpdated);
    };
  }, [socket, callId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background-subtle">
        <div className="w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!log || !call) return null;

  const isSessionActive = call.status === "active" || call.status === "ringing";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background-subtle relative">
      {/* Top Navigation Toggle */}
      <div className="h-16 bg-white border-b border-background-subtle flex items-center px-6 shrink-0 z-30 shadow-sm relative justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-background hover:bg-background-subtle transition-colors text-foreground group"
            title="Go Back"
          >
            <FiArrowLeft className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
          </button>

          <div className="flex items-center gap-3 border-l border-background-subtle pl-6">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${isSessionActive ? "bg-primary/10 text-primary animate-pulse" : "bg-background text-foreground/40"}`}
            >
              {log.source === "voice_call" ? (
                <FiPhoneCall className="w-5 h-5" />
              ) : (
                <FiMessageSquare className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="title-medium text-foreground leading-tight">
                {isSessionActive
                  ? "Active Emergency Session"
                  : "Emergency Session Ended"}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/50 font-medium">
                  {log.source === "voice_call" ? "Voice Call" : "Chat Session"}
                </span>
                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                <span className="text-xs font-mono text-foreground/40">
                  {call.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex bg-background p-1.5 rounded-xl border border-background-subtle">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-1.5 rounded-lg body-small font-semibold transition-all ${
              activeTab === "details"
                ? "bg-white text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                : "text-foreground/50 hover:text-foreground hover:bg-white/50"
            }`}
          >
            Communication
          </button>
          <button
            onClick={() => setActiveTab("location")}
            className={`px-6 py-1.5 rounded-lg body-small font-semibold transition-all ${
              activeTab === "location"
                ? "bg-white text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                : "text-foreground/50 hover:text-foreground hover:bg-white/50"
            }`}
          >
            Location Map
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Panel: Toggles between Communication and Location */}
        <div className="flex-1 flex flex-col h-full bg-background border-r border-background-subtle animate-in fade-in slide-in-from-left-4 min-w-0 overflow-hidden relative">
          <div
            className={`w-full h-full flex flex-col ${activeTab === "details" ? "flex" : "hidden"}`}
          >
            <CommunicationPanel log={log} socket={socket || undefined} />
          </div>
          <div
            className={`w-full h-full flex flex-col bg-background ${activeTab === "location" ? "flex" : "hidden"}`}
          >
            <LocationPanel
              latitude={log.latitude ?? null}
              longitude={log.longitude ?? null}
              channels={log.channels}
            />
          </div>
        </div>

        {/* Right Panel: Incident Details Form (ALWAYS VISIBLE) */}
        <div className="w-[320px] md:w-[350px] lg:w-[400px] shrink-0 h-full bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-20 border-l border-background-subtle overflow-hidden">
          <IncidentFormPanel log={log} onUpdate={setLog} />
        </div>
      </div>
    </div>
  );
}
