"use client";

import React, { useState, useEffect } from "react";
import { FiCheck, FiUser, FiPhone, FiMapPin, FiAlignLeft, FiSave } from "react-icons/fi";
import { Log } from "../types/logs.types";
import { logsApi } from "../api/logs.api";
import { toast } from "react-hot-toast";

interface IncidentFormPanelProps {
  log: Log | null;
  onUpdate: (updatedLog: Log) => void;
}

export default function IncidentFormPanel({ log, onUpdate }: IncidentFormPanelProps) {
  const [formData, setFormData] = useState({
    caller_name: "",
    caller_contact: "",
    address: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setFormData({
        caller_name: log.caller_name || "",
        caller_contact: log.caller_contact || "",
        address: log.address || "",
        description: log.description || "",
      });
    }
  }, [log]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!log) return;
    setIsSaving(true);
    try {
      const updated = await logsApi.updateLog(log.id, formData);
      onUpdate({ ...log, ...updated });
      toast.success("Incident details saved.");
    } catch (error) {
      toast.error("Failed to save incident details.");
    } finally {
      setIsSaving(false);
    }
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
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isSaving ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-background-subtle/20">
        <div className="space-y-4 pb-8">
          
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
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full bg-background border border-background-subtle rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20"
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
                    placeholder="e.g. 09123456789"
                    className="w-full bg-background border border-background-subtle rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20"
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
                    placeholder="e.g. 123 Quezon St..."
                    rows={2}
                    className="w-full bg-background border border-background-subtle rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none hover:border-foreground/20"
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
                  placeholder="Describe the emergency situation..."
                  rows={5}
                  className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none hover:border-foreground/20 leading-relaxed"
                />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
