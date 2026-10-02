"use client";

import { useState, useEffect, useRef } from "react";
import { logsApi } from "../api/logs.api";
import { toast } from "react-hot-toast";
import { FiMessageSquare, FiSend, FiClock } from "react-icons/fi";
import { io } from "socket.io-client";

interface CoordinationUpdatesSectionProps {
  logId: string;
  isReadOnly?: boolean;
}

export function CoordinationUpdatesSection({
  logId,
  isReadOnly = false,
}: CoordinationUpdatesSectionProps) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const fetchUpdates = async () => {
    try {
      const data = await logsApi.getCoordinationUpdates(logId);
      setUpdates(data || []);
    } catch (error) {
      console.error("Failed to fetch coordination updates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [updates]);

  useEffect(() => {
    fetchUpdates();
    
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketUrl = rawUrl.replace(/\/api\/?$/, "") + "/logs";
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('subscribe_log', { logId });
    });

    socket.on('coordination_update', (update: any) => {
      setUpdates((prev: any) => {
        if (prev.find((u: any) => u.id === update.id)) return prev;
        return [update, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [logId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSubmitting(true);
      await logsApi.createInternalCoordinationUpdate(logId, {
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      toast.error("Failed to post update");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <FiMessageSquare className="w-4 h-4" /> Coordination Updates
      </h3>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col-reverse">
        {loading && updates.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            Loading chat...
          </div>
        ) : updates.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4 italic">
            No coordination updates yet.
          </div>
        ) : (
          <>
            <div ref={endOfMessagesRef} />
            {updates.map((update, idx) => {
              const isInternal = update.source === "internal";
              return (
                <div
                  key={update.id || idx}
                  className={`flex gap-3 ${isInternal ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gray-500">
                      {isInternal
                        ? "CC"
                        : update.agency?.name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div
                    className={`flex flex-col ${isInternal ? "items-end" : "items-start"} max-w-[80%]`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-gray-600">
                        {isInternal
                          ? update.created_by?.name || "Command Center"
                          : update.agency?.name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(update.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere overflow-hidden max-w-[100%] ${
                        isInternal
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {update.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {!isReadOnly && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-3 rounded-xl border border-gray-200 flex items-end gap-2 shadow-sm"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Send a coordination message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none"
            rows={1}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50 shrink-0"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
