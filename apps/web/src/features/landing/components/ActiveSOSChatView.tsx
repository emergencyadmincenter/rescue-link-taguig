"use client";

import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { FiX, FiCheck, FiSend, FiImage, FiMessageSquare } from "react-icons/fi";
import toast from "react-hot-toast";
import { logsApi } from "@/features/logs/api/logs.api";

interface ActiveSOSChatViewProps {
  callId: string;
  callData: any;
  socket: Socket;
}

export default function ActiveSOSChatView({
  callId,
  callData,
  socket,
}: ActiveSOSChatViewProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sessionEndReason, setSessionEndReason] = useState<
    "resident" | "coordinator" | "system" | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (callData.logId) {
      socket.emit("join_log_room", callData.logId);
    }

    logsApi
      .getCallDetails(callId)
      .then((data) => {
        if (data?.log?.messages) {
          setMessages(data.log.messages);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      })
      .catch(console.error);

    const onChatMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    const onCallEnded = (payload: any) => {
      if (payload?.endedBy === "coordinator") {
        setSessionEndReason("coordinator");
      } else if (payload?.endedBy === "system") {
        setSessionEndReason("system");
      }
    };

    socket.on("chat_message", onChatMessage);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("chat_message", onChatMessage);
      socket.off("call_ended", onCallEnded);
    };
  }, [socket, callData.logId]);

  useEffect(() => {
    if (sessionEndReason) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionEndReason]);

  const handleEndCall = () => {
    socket.emit("end_call", { callId });
    setSessionEndReason("resident");
  };

  const handleSend = () => {
    if (!text.trim() || !socket || !callId) return;
    socket.emit("send_chat_message", {
      callId,
      type: "text",
      text,
    });
    setText("");
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
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in">
      <div className="p-4 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-lg font-bold text-gray-600">CC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium">Command Center</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-success text-xs font-medium">
                Active Chat
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="text-danger hover:text-danger-hover bg-danger/10 hover:bg-danger/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          title="End Chat"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <FiMessageSquare className="w-10 h-10 text-primary/40" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Connected to Command Center
            </h2>
            <p className="text-sm text-center max-w-[250px] text-gray-500">
              Send a message to share your situation, ask questions, or get help
              immediately.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => {
              const isResident = msg.sender_type === "resident";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isResident ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2`}
                >
                  <div
                    className={`px-4 py-3 text-sm shadow-sm max-w-[85%] ${
                      isResident
                        ? "bg-primary text-white rounded-2xl rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-end gap-2 mx-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:bg-gray-50 border border-transparent focus:border-primary/30 transition-colors resize-none min-h-[44px] max-h-32 custom-scrollbar"
            rows={1}
            ref={(el) => {
              if (el) {
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }
            }}
          />
          <button
            onClick={() =>
              toast.error("Image upload is currently unavailable.")
            }
            className="p-3 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-xl mb-1"
          >
            <FiImage className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-3 bg-primary text-white hover:bg-primary-hover transition-colors rounded-xl disabled:opacity-50 shadow-sm mb-1"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
