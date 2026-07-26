"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket";
import { FiLoader, FiPhoneCall, FiAlertCircle, FiRadio } from "react-icons/fi";
import ActiveSOSView from "./ActiveSOSView";
import ActiveSOSChatView from "./ActiveSOSChatView";
import { logsApi } from "@/features/logs/api/logs.api";
import toast from "react-hot-toast";

export default function ConnectingScreen({ callId }: { callId: string }) {
  const { socket, isConnected } = useSocket();
  const [status, setStatus] = useState<
    "connecting" | "ringing" | "accepted" | "timeout" | "missed" | "rejected"
  >("connecting");
  const [statusMessage, setStatusMessage] = useState(
    "Connecting to Command Center...",
  );
  const [activeCallData, setActiveCallData] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  useEffect(() => {
    logsApi.getCallDetails(callId).then((data) => {
      if (data?.log) {
        setLocationStatus(data.log.location_status);
      }
    }).catch(() => {});
  }, [callId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("join_call_room", callId);

    const onRoutingStatus = (data: any) => {
      setStatus(data.status); // 'ringing'
      setStatusMessage(data.message);
    };

    const onCallAccepted = (data: any) => {
      setStatus("accepted");
      setActiveCallData(data);
    };

    const onRoutingTimeout = (data: any) => {
      setStatus("timeout");
      setStatusMessage(data.message);
    };

    const onCallMissed = (data: any) => {
      setStatus("missed");
      setStatusMessage(
        data.message || "No coordinators were available to answer your call.",
      );
    };

    const onCallRejected = (data: any) => {
      setStatus("rejected");
      setStatusMessage(
        data.reason || "The request was rejected by the coordinator.",
      );
    };

    socket.on("routing_status", onRoutingStatus);
    socket.on("call_accepted", onCallAccepted);
    socket.on("routing_timeout", onRoutingTimeout);
    socket.on("call_missed", onCallMissed);
    socket.on("call_rejected", onCallRejected);

    return () => {
      socket.off("routing_status", onRoutingStatus);
      socket.off("call_accepted", onCallAccepted);
      socket.off("routing_timeout", onRoutingTimeout);
      socket.off("call_missed", onCallMissed);
      socket.off("call_rejected", onCallRejected);
    };
  }, [socket, isConnected, callId]);

  const handleTryAgain = async () => {
    try {
      setStatus("connecting");
      setStatusMessage("Reconnecting...");
      const data = await logsApi.getCallDetails(callId);
      if (data && data.log && data.call) {
        const newEmergency = await logsApi.createEmergency({
          communicationMethod: data.call.communication_method as
            "voice" | "chat",
          latitude: data.log.latitude,
          longitude: data.log.longitude,
        });

        if (newEmergency && newEmergency.id) {
          window.location.href = `/sos/${newEmergency.id}`;
        } else {
          throw new Error("Failed to create new emergency request");
        }
      } else {
        throw new Error("Could not fetch previous call details");
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.message || "Failed to reconnect. Please try again or call 911.";
      toast.error(errorMsg, {
        id: "reconnect-error",
      });
      setStatus("missed");
      setStatusMessage("Failed to reconnect.");
    }
  };

  if (status === "accepted" && activeCallData) {
    if (activeCallData.communicationMethod === "chat") {
      return (
        <ActiveSOSChatView
          callId={callId}
          callData={activeCallData}
          socket={socket!}
        />
      );
    }
    return (
      <ActiveSOSView
        callId={callId}
        callData={activeCallData}
        socket={socket!}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-[90vw] md:w-[50vw] flex flex-col items-center text-center">
        {status === "timeout" ||
        status === "missed" ||
        status === "rejected" ? (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiAlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="title-medium text-gray-900 mb-2">
              {status === "rejected" ? "Request Rejected" : "Request Missed"}
            </h1>
            <p className="body-medium text-gray-500 mb-8">{statusMessage}</p>

            <button
              onClick={handleTryAgain}
              className="w-full py-3 bg-danger text-white rounded-xl font-medium hover:bg-danger-hover transition-colors mb-3"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </>
        ) : (
          <>
            <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 border-[3px] border-danger/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] z-0"></div>
              <div
                className="absolute inset-0 border-[3px] border-danger/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] z-0"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute inset-0 border-[3px] border-danger/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] z-0"
                style={{ animationDelay: "1s" }}
              ></div>

              <div className="w-24 h-24 bg-gradient-to-tr from-danger/20 to-danger/5 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(225,29,72,0.3)] border border-danger/30 backdrop-blur-sm">
                <FiRadio className="w-10 h-10 text-danger animate-pulse" />
              </div>
            </div>

            <h1 className="title-medium text-gray-900 mb-2">
              Connecting to Emergency Service...
            </h1>
            <div className="min-h-[48px] flex flex-col items-center justify-center gap-2">
              <p className="body-medium text-gray-500 text-center">
                {statusMessage ||
                  "Please wait while we secure a connection with an available coordinator."}
              </p>
              {locationStatus && locationStatus !== "success" && (
                <p className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <FiAlertCircle className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5 text-gray-500" />
                  The coordinator will ask for your location directly once connected.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
