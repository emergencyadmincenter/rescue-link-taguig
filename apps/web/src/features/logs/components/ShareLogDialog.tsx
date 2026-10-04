"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiShare2,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";
import { logsApi } from "../api/logs.api";
import { toast } from "react-hot-toast";

interface ShareLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logId: string;
  initialToken?: string | null;
  onTokenGenerated?: (token: string | null) => void;
}

export default function ShareLogDialog({
  isOpen,
  onClose,
  logId,
  initialToken,
  onTokenGenerated,
}: ShareLogDialogProps) {
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [copied, setCopied] = useState(false);

  const [agencies, setAgencies] = useState<any[]>([]);
  const [fetchingAgencies, setFetchingAgencies] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync with initialToken when the page first loads or the log data updates
  useEffect(() => {
    if (initialToken !== undefined) {
      setToken(initialToken);
    }
  }, [initialToken]);

  useEffect(() => {
    if (token && logId && isOpen) {
      fetchAgencies();
    }
  }, [token, logId, isOpen]);

  const fetchAgencies = async () => {
    try {
      setFetchingAgencies(true);
      const data = await logsApi.getLogCoordinations(logId);
      const manualCoords = data.coordinations || [];
      const recommended = data.recommendedAgencies || [];
      
      // Combine them, avoiding duplicates
      const existingAgencyIds = new Set(manualCoords.map((c: any) => c.agency_id));
      const combined = [...manualCoords];
      
      recommended.forEach((agency: any) => {
        if (!existingAgencyIds.has(agency.id)) {
          combined.push({
            agency_id: agency.id,
            agency: agency,
            status: 'recommended', // Indicate it's not fully coordinated yet
            access_token: null, // No token yet
          });
        }
      });
      
      setAgencies(combined);
    } catch (error) {
      console.error("Failed to fetch agencies", error);
    } finally {
      setFetchingAgencies(false);
    }
  };

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const res = await logsApi.generateShareLink(logId);
      setToken(res.token);
      if (onTokenGenerated) {
        onTokenGenerated(res.token);
      }
    } catch (error) {
      toast.error("Failed to generate share link");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    try {
      setRevoking(true);
      await logsApi.revokePublicShareLink(logId);
      setToken(null);
      if (onTokenGenerated) {
        onTokenGenerated(null);
      }
      toast.success("Public share link revoked");
    } catch (error) {
      toast.error("Failed to revoke share link");
      console.error(error);
    } finally {
      setRevoking(false);
    }
  };

  const shareUrl = token ? `${window.location.origin}/public/log/${token}` : "";

  const handleCopyAgency = async (agencyObj: any) => {
    let urlToCopy = "";
    let finalAgencyId = agencyObj.id || agencyObj.agency_id;
    
    if (agencyObj.access_token) {
      urlToCopy = `${window.location.origin}/public/log/${token}?agencyToken=${agencyObj.access_token}`;
    } else {
      // Need to create the coordination record first
      try {
        const newCoord = await logsApi.updateLogCoordination(logId, finalAgencyId, { status: "pending" });
        urlToCopy = `${window.location.origin}/public/log/${token}?agencyToken=${newCoord.access_token}`;
        // Update local state to reflect the new token
        setAgencies((prev) => 
          prev.map(a => a.agency_id === finalAgencyId ? { ...a, access_token: newCoord.access_token, status: "pending" } : a)
        );
      } catch (err) {
        toast.error("Failed to generate agency link");
        return;
      }
    }
    
    await handleCopy(urlToCopy, finalAgencyId);
  };

  const handleCopy = async (url: string, id?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[40%] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FiShare2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 font-outfit">
              Share Emergency Log
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <p className="text-sm text-gray-600">
            Generate a secure public link for this emergency log. The link
            allows external agencies to view the emergency details without
            requiring authentication.
          </p>

          <div className="space-y-2">
            {!token ? (
              <button
                onClick={handleGenerateLink}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Public Link"}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      Public Link (View Only)
                    </span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md">
                      Expires in 30 days
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopy(shareUrl)}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center min-w-[100px]"
                    >
                      {copied ? (
                        <span className="flex items-center gap-1.5">
                          <FiCheck className="w-4 h-4" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <FiCopy className="w-4 h-4" /> Copy
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleRevokeLink}
                      disabled={revoking}
                      className="text-xs text-danger hover:text-danger-hover flex items-center gap-1 font-medium transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      {revoking ? "Revoking..." : "Revoke Public Link"}
                    </button>
                  </div>
                </div>

                {/* Agency Coordination Links */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <FiShare2 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Agency Coordination Links
                    </h3>
                  </div>

                  <div className="p-4 space-y-4">
                    <p className="text-xs text-gray-500">
                      Share these unique links directly with the involved
                      agencies. These links allow them to view the log and
                      participate in the live Coordination Updates chat.
                    </p>

                    {fetchingAgencies ? (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Loading agencies...
                      </div>
                    ) : agencies.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500">
                          No agencies are currently coordinating for this log.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agencies.map((agency) => {
                          const finalId = agency.id || agency.agency_id;
                          return (
                            <div
                              key={finalId}
                              className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {agency.agency?.name || "Unknown Agency"}
                                </h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  Status:{" "}
                                  <span className="capitalize">
                                    {agency.status}
                                  </span>
                                </p>
                              </div>
                              <button
                                onClick={() => handleCopyAgency(agency)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                              >
                                {copiedId === finalId ? (
                                  <>
                                    <FiCheck className="w-3.5 h-3.5 text-success" />{" "}
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <FiCopy className="w-3.5 h-3.5" /> {agency.access_token ? "Copy Link" : "Generate & Copy"}
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-warning/10 text-warning rounded-lg text-xs leading-relaxed">
                  <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Note:</strong> Sensitive information (like fraud
                    risk and coordinator notes) is automatically hidden in the
                    shared view. Agency links become invalid if the agency is
                    removed from the coordination panel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
