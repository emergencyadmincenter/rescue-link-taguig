"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { logsApi } from "@/features/logs/api/logs.api";
import {
  FiClock,
  FiMapPin,
  FiAlignLeft,
  FiCalendar,
  FiShield,
  FiWind,
  FiCloud,
  FiAlertCircle,
  FiUser,
  FiPhone,
} from "react-icons/fi";
import InteractiveLocationMap from "@/features/logs/components/InteractiveLocationMap";
import Image from "next/image";

export default function PublicLogPage() {
  const { token } = useParams<{ token: string }>();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLog() {
      try {
        const data = await logsApi.getPublicLog(token);
        setLog(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchLog();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading emergency log...</p>
        </div>
      </div>
    );
  }

  if (error || !log) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "ringing":
        return "bg-danger text-white";
      case "dispatched":
        return "bg-warning text-warning-foreground";
      case "resolved":
      case "ended":
        return "bg-success text-white";
      case "cancelled":
      case "dropped":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className=" mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-32 h-8">
              <Image
                src="/images/logos/rlt-main-logo.png"
                alt="Rescue Link Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
              Official Record
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 pt-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Top meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(log.status)}`}
                >
                  {log.status}
                </span>
                <span className="text-gray-400 text-sm font-medium">
                  Ref: {log.reference_no}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-outfit">
                Emergency Log Details
              </h1>
            </div>

            <div className="flex flex-col gap-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[200px]">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(log.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(log.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {log.resolved_at && (
                <div className="flex items-center gap-2 text-success mt-1 pt-1 border-t border-gray-200">
                  <FiClock className="w-4 h-4" />
                  <span>
                    Resolved:{" "}
                    {new Date(log.resolved_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info column */}
            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiUser className="w-4 h-4" /> Resident Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                      <FiUser className="w-3 h-3" /> Name
                    </div>
                    <div className="font-medium text-gray-900">
                      {log.caller_name || "Unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                      <FiPhone className="w-3 h-3" /> Contact Number
                    </div>
                    <div className="font-medium text-gray-900">
                      {log.caller_contact || "Unknown"}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiAlignLeft className="w-4 h-4" /> Incident Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Category</div>
                    <div className="font-medium text-gray-900">
                      {log.incident_category?.name || "Uncategorized"}
                    </div>
                  </div>
                  {log.description && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Description
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4" /> Emergency Response
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  {log.needs && log.needs.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Required Assistance</div>
                      <div className="flex flex-wrap gap-2">
                        {log.needs.map((need: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md capitalize">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {log.channels && log.channels.length > 0 && (
                    <div className={log.needs && log.needs.length > 0 ? "pt-3 border-t border-gray-200" : ""}>
                      <div className="text-sm text-gray-500 mb-2">Notified Agencies / Dispatch Units</div>
                      <div className="flex flex-wrap gap-2">
                        {log.channels.map((channel: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-md capitalize">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!log.needs || log.needs.length === 0) && (!log.channels || log.channels.length === 0) && (
                    <div className="text-sm text-gray-400 italic">
                      Response details are currently being assessed.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" /> Location Details
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  {log.address && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Address</div>
                      <div className="font-medium text-gray-900">
                        {log.address}
                      </div>
                    </div>
                  )}
                  {log.barangay && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Barangay</div>
                      <div className="font-medium text-gray-900">
                        {log.barangay}
                      </div>
                    </div>
                  )}
                  {log.weather_condition && (
                    <div className="pt-3 border-t border-gray-200 flex items-center gap-2">
                      <FiCloud className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Reported weather: {log.weather_condition}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Map column */}
            <div className="flex flex-col">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" /> Interactive Map
              </h3>

              <div className="flex-1 min-h-[400px] bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-inner relative">
                {log.latitude && log.longitude ? (
                  <InteractiveLocationMap
                    latitude={Number(log.latitude)}
                    longitude={Number(log.longitude)}
                    isPublic={true}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                    <FiMapPin className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">No coordinates available</p>
                    <p className="text-sm">
                      The exact location was not pinned for this incident.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm flex items-center justify-center gap-2 mt-8">
          <FiShield className="w-4 h-4" /> This is a securely shared public
          record. Sensitive internal data has been redacted.
        </div>
      </main>
    </div>
  );
}
