"use client";

import { useState, useEffect } from "react";
import { FiX, FiCopy, FiCheck, FiShare2, FiAlertCircle } from "react-icons/fi";
import { logsApi } from "../api/logs.api";
import { toast } from "react-hot-toast";

interface ShareLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logId: string;
  initialToken?: string | null;
}

export default function ShareLogDialog({
  isOpen,
  onClose,
  logId,
  initialToken,
}: ShareLogDialogProps) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [copied, setCopied] = useState(false);

  // Sync with initialToken when the page first loads or the log data updates
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const res = await logsApi.generateShareLink(logId);
      setToken(res.token);
    } catch (error) {
      toast.error("Failed to generate share link");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = token ? `${window.location.origin}/public/log/${token}` : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
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

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Generate a secure public link for this emergency log. The link
            allows external agencies to view the emergency details without
            requiring authentication.
          </p>

          <div className="bg-warning/10 p-3 rounded-lg flex gap-3 text-warning border border-warning/20">
            <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">
              Links automatically expire 30 days after they are generated.
              Internal sensitive information remains hidden.
            </div>
          </div>

          {!token ? (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiShare2 className="w-5 h-5" /> Generate Public Link
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Public Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 rounded-xl flex items-center justify-center transition-all ${
                    copied
                      ? "bg-success text-white"
                      : "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow"
                  }`}
                >
                  {copied ? (
                    <FiCheck className="w-5 h-5" />
                  ) : (
                    <FiCopy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
