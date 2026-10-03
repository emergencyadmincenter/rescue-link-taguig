"use client";

import React, { useEffect, useState } from "react";
import { FiX, FiInfo, FiCloudRain, FiMap } from "react-icons/fi";

interface StatusInfoDialogProps {
  onClose: () => void;
  activeTab: "severity" | "flood_risk";
}

export default function StatusInfoDialog({
  onClose,
  activeTab,
}: StatusInfoDialogProps) {
  const [tab, setTab] = useState<"severity" | "flood_risk">(activeTab);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl w-[50%] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FiInfo className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 font-outfit">
              Status Classifications Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-100 px-6 pt-4 flex gap-6">
          <button
            onClick={() => setTab("severity")}
            className={`pb-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${
              tab === "severity"
                ? "text-primary border-primary"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <FiCloudRain className="w-4 h-4" />
            Weather Severity
          </button>
          <button
            onClick={() => setTab("flood_risk")}
            className={`pb-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${
              tab === "flood_risk"
                ? "text-primary border-primary"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <FiMap className="w-4 h-4" />
            Flood Risk Levels
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30">
          {tab === "severity" ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                The Weather Severity classifications are heavily influenced by
                the standard heavy rainfall warning system utilized by the
                Philippine Atmospheric, Geophysical and Astronomical Services
                Administration (PAGASA). They categorize the intensity of
                rainfall and the necessary response.
              </p>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-red-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-red-700 font-bold mb-1">
                      Severe (Red Warning)
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong>Condition:</strong> Torrential rainfall of more
                      than 30mm within one hour and expected to continue.
                      <br />
                      <strong>Impact:</strong> Serious flooding is expected in
                      low-lying areas. Immediate threat to life and property.
                      <br />
                      <strong>Response:</strong> EVACUATION is highly
                      recommended or required.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-yellow-700 font-bold mb-1">
                      Advisory / Warning (Orange & Yellow)
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong>Condition:</strong> Moderate to heavy rainfall
                      (7.5mm - 30mm) within one hour.
                      <br />
                      <strong>Impact:</strong> Flooding is threatening or
                      possible in low-lying areas and near river channels.
                      <br />
                      <strong>Response:</strong> MONITOR the weather condition
                      and be PREPARED for possible evacuation if conditions
                      worsen.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-emerald-700 font-bold mb-1">Normal</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong>Condition:</strong> Light or no significant
                      rainfall.
                      <br />
                      <strong>Impact:</strong> No immediate weather disturbances
                      affecting the area.
                      <br />
                      <strong>Response:</strong> Routine operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Flood Risk Levels are calculated using a multi-factor
                vulnerability model based on local DRRM (Disaster Risk Reduction
                and Management) standards. This algorithm factors in current
                precipitation, rainfall duration, barangay elevation, drainage
                quality, and waterway proximity to generate a real-time risk
                score.
              </p>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-red-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-red-700 font-bold mb-1">High Risk</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Immediate threat of severe flooding. This occurs when
                      intense, prolonged rainfall directly impacts highly
                      vulnerable terrain (such as low elevation areas near the
                      lakeshore or rivers with poor drainage). Water levels may
                      rapidly breach critical thresholds.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-orange-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-orange-800 font-bold mb-1">
                      Elevated Risk
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Significant chance of flooding. Active water ponding is
                      likely, and local waterways may be near spilling levels.
                      Close monitoring of low-lying and susceptible areas is
                      strictly required by field coordinators.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-yellow-800 font-bold mb-1">
                      Moderate Risk
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Localized water ponding or minor flooding is possible,
                      especially in areas with historically poor drainage. While
                      it does not pose an immediate threat to life, it may
                      disrupt transportation and daily community activities.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-emerald-700 font-bold mb-1">
                      Low Risk
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Standard terrain risk with no immediate or significant
                      threat of flooding. Environmental factors are currently
                      stable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
