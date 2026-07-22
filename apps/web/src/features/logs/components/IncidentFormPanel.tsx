"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FiCheck,
  FiUser,
  FiPhone,
  FiMapPin,
  FiAlignLeft,
  FiSave,
  FiAlertTriangle,
} from "react-icons/fi";
import { Log } from "../types/logs.types";
import { logsApi } from "../api/logs.api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { useAutoSave } from "../hooks/useAutoSave";

interface IncidentFormPanelProps {
  log: Log | null;
  onUpdate: (updatedLog: Log) => void;
  isActiveSession?: boolean;
}

export default function IncidentFormPanel({
  log,
  onUpdate,
  isActiveSession,
}: IncidentFormPanelProps) {
  const { user } = useAuth();
  const isOwner =
    user &&
    log &&
    (log.assigned_coordinator_id === user.id ||
      log.created_by_coordinator_id === user.id ||
      !log.assigned_coordinator_id);
  const isReadOnly = !isOwner || isActiveSession === false;

  const [formData, setFormData] = useState({
    caller_name: "",
    caller_contact: "",
    address: "",
    description: "",
  });

  const { debouncedSave, isSaving } = useAutoSave({
    onSave: async (dataToSave) => {
      if (!log || isReadOnly) return;
      try {
        const updated = await logsApi.updateLog(log.id, dataToSave);
        onUpdate({ ...log, ...updated });
      } catch (error) {
        toast.error("Failed to auto-save incident details.");
      }
    },
    debounceMs: 1000,
  });

  const autoPopulatedRefs = useRef<Set<string>>(new Set());
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (log) {
      setFormData((prev) => ({
        // We only override with log's value if we don't have local edits or if log has a new truthy value.
        caller_name: log.caller_name || prev.caller_name || "",
        caller_contact: log.caller_contact || prev.caller_contact || "",
        address:
          log.address && log.address !== "Unknown"
            ? log.address
            : prev.address || "",
        description: log.description || prev.description || "",
      }));

      // Auto-populate address from lat/lng if not present or if it's "Unknown"
      if (
        (!log.address || log.address === "Unknown") &&
        log.latitude &&
        log.longitude &&
        !isReadOnly &&
        !autoPopulatedRefs.current.has(log.id)
      ) {
        autoPopulatedRefs.current.add(log.id);
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${log.latitude}&lon=${log.longitude}`,
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.display_name) {
              const currentAddress = formDataRef.current.address;
              if (!currentAddress || currentAddress === "Unknown") {
                debouncedSave({ address: data.display_name });
              }
              setFormData((prev) => ({
                ...prev,
                address:
                  !prev.address || prev.address === "Unknown"
                    ? data.display_name
                    : prev.address,
              }));
            }
          })
          .catch((err) => {
            console.error("Failed to reverse geocode", err);
          });
      }
    }
  }, [log, isReadOnly]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    debouncedSave({ [name]: value });
  };

  if (!log) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="p-5 bg-white border-b border-background-subtle shrink-0 shadow-sm z-10 flex justify-between items-center">
        <div>
          <h2 className="title-medium text-foreground">Incident Workspace</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              {log.reference_no}
            </span>
            {isSaving && (
              <span className="text-xs text-foreground/50 ml-2 animate-pulse">
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-background-subtle/20">
        <div className="space-y-4 pb-8">
          {isReadOnly && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2.5 text-warning-hover shadow-sm">
              <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-xs">View-Only Mode</h3>
                <p className="text-[10px] mt-0.5 opacity-90 text-warning-hover leading-tight">
                  {isActiveSession === false && isOwner ? (
                    "This communication session has ended. To make further edits, please use the Emergency Logs page."
                  ) : (
                    <>
                      This log is currently owned by{" "}
                      {log.assigned_coordinator?.name || "another coordinator"}.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Caller Information Card */}
          <section className="bg-white rounded-xl border border-background-subtle shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 border-b border-background-subtle/50 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FiUser className="text-primary w-3.5 h-3.5" />
                Caller Information
              </h3>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <FiUser className="text-foreground/30 w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    name="caller_name"
                    value={formData.caller_name}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    disabled={isReadOnly}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full bg-background border border-background-subtle rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20 disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1">
                  Contact Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <FiPhone className="text-foreground/30 w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    name="caller_contact"
                    value={formData.caller_contact}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    disabled={isReadOnly}
                    placeholder="e.g. 09123456789"
                    className="w-full bg-background border border-background-subtle rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20 disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Incident Details Card */}
          <section className="bg-white rounded-xl border border-background-subtle shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 border-b border-background-subtle/50 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FiAlignLeft className="text-primary w-3.5 h-3.5" />
                Incident Details
              </h3>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-0 pl-2.5 flex items-start pointer-events-none">
                    <FiMapPin className="text-foreground/30 w-3.5 h-3.5" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    disabled={isReadOnly}
                    placeholder="e.g. 123 Quezon St..."
                    rows={2}
                    className="w-full bg-background border border-background-subtle rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none hover:border-foreground/20 disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1 flex justify-between items-center">
                  <span>Description</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  disabled={isReadOnly}
                  placeholder="Describe the emergency situation..."
                  rows={5}
                  className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none hover:border-foreground/20 leading-relaxed disabled:opacity-70"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
