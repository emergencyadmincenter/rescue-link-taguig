"use client";

import React, { useEffect, useState } from "react";
import { FiClock, FiFileText, FiArrowRight, FiActivity } from "react-icons/fi";
import { logsApi } from "@/features/logs/api/logs.api";
import Link from "next/link";

interface ResidentLogSummary {
  callId: string;
  reference_no: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  category: string;
}

export function ResidentMyLogsSection({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const [logs, setLogs] = useState<ResidentLogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyLogs() {
      try {
        const data = await logsApi.getResidentMyLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch my logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyLogs();
  }, []);

  if (loading) {
    if (!standalone) return null;
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    if (!standalone) return null;
    return (
      <div className="w-full text-center py-24 text-gray-500">
        <FiActivity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          No emergency logs found
        </h3>
        <p className="mt-2">
          You don't have any recent emergency logs available.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "ringing":
        return "bg-danger/10 text-danger border-danger/20";
      case "dispatched":
        return "bg-warning/50 text-warning-foreground border-warning/20";
      case "resolved":
      case "ended":
        return "bg-success/10 text-success border-success/20";
      case "cancelled":
      case "dropped":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  return (
    <section
      className={
        standalone
          ? "p-8 w-full h-full"
          : "py-8 bg-gray-50 border-y border-gray-100"
      }
    >
      <div
        className={
          standalone ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        }
      >
        <div className="flex items-center gap-2 mb-6">
          <FiActivity className="w-5 h-5 text-primary" />
          <h2 className="title-medium text-gray-900 m-0">
            Your Recent Emergency Logs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map((log) => (
            <Link
              key={log.callId}
              href={`/resident/log/${log.callId}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-colors" />
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-gray-900 font-outfit">
                  {log.reference_no}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(log.status)}`}
                >
                  {log.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiFileText className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{log.category}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(log.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center text-primary text-sm font-medium group-hover:gap-1.5 transition-all">
                View Details{" "}
                <FiArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
