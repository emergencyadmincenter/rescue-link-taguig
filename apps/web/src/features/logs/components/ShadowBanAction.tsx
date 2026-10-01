"use client";

import React, { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { FiShieldOff, FiShield } from "react-icons/fi";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { toast } from "react-hot-toast";
import {
  shadowBansApi,
  ShadowBanSeverity,
  ShadowBanViolationCategory,
} from "../api/shadow-bans.api";

interface ShadowBanActionProps {
  callId: string;
  isOwner: boolean;
  isAdmin: boolean;
}

const CATEGORY_OPTIONS: {
  value: ShadowBanViolationCategory;
  label: string;
  severity?: ShadowBanSeverity;
  duration: string;
}[] = [
  {
    value: "fake_rescue_call",
    label: "Fake emergency or rescue call",
    severity: "high",
    duration: "7 days",
  },
  {
    value: "spam",
    label: "Spam or repeated unnecessary requests",
    severity: "low",
    duration: "24 hours",
  },
  {
    value: "fraudulent_activity",
    label: "Fraudulent activity",
    severity: "critical",
    duration: "Indefinite",
  },
  {
    value: "abusive_malicious_use",
    label: "Abusive or malicious use",
    severity: "high",
    duration: "7 days",
  },
  {
    value: "impersonation_identity_misuse",
    label: "Impersonation or identity misuse",
    severity: "high",
    duration: "7 days",
  },
  {
    value: "coordinated_system_abuse",
    label: "Coordinated system abuse",
    severity: "critical",
    duration: "Indefinite",
  },
  {
    value: "other",
    label: "Other policy violation",
    duration: "Choose severity",
  },
];

const SEVERITY_OPTIONS: { value: ShadowBanSeverity; label: string }[] = [
  { value: "low", label: "Low: temporary restriction" },
  { value: "high", label: "High: longer restriction" },
  { value: "critical", label: "Critical: indefinite restriction" },
];

const SEVERITY_DURATIONS: Record<ShadowBanSeverity, string> = {
  low: "24 hours",
  high: "7 days",
  critical: "Indefinite",
};

export function ShadowBanAction({
  callId,
  isOwner,
  isAdmin,
}: ShadowBanActionProps) {
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [category, setCategory] = useState<ShadowBanViolationCategory>("other");
  const [severity, setSeverity] = useState<ShadowBanSeverity>("low");
  const [details, setDetails] = useState("");

  const selectedCategory = CATEGORY_OPTIONS.find(
    (option) => option.value === category,
  );
  const selectedSeverity = selectedCategory?.severity ?? severity;
  const selectedDuration = SEVERITY_DURATIONS[selectedSeverity];

  // Requirement: Administrators must not be able to shadow ban or remove a shadow ban.
  // Requirement: Only the coordinator who owns the active communication session may perform this action.
  const canPerformAction = isOwner && !isAdmin;

  useEffect(() => {
    if (!callId) return;

    shadowBansApi
      .getStatus(callId)
      .then((status) => {
        setIsBanned(status.isBanned);
        setHistoryCount(status.history.length);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch shadow ban status", err);
        setLoading(false); // Fails gracefully without blocking UI
      });
  }, [callId, canPerformAction]);

  if (loading) return null;

  const handleToggle = async () => {
    if (!reason.trim() && !isBanned) {
      toast.error("A reason is required to apply a shadow ban.");
      return;
    }

    setIsSubmitting(true);
    try {
      const action = isBanned ? "unban" : "ban";
      await shadowBansApi.toggleBan(
        callId,
        action,
        reason,
        category,
        severity,
        details,
      );

      toast.success(
        isBanned
          ? "Shadow ban removed successfully."
          : "Resident has been shadow banned.",
      );
      setIsBanned(!isBanned);
      setDialogOpen(false);
      setReason("");
      setDetails("");
    } catch (error: unknown) {
      const msg = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(msg || "Failed to update shadow ban status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        disabled={!canPerformAction}
        className={`text-xs text-nowrap flex items-center gap-2 px-4 py-2 rounded-lg body-small font-semibold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
          isBanned
            ? "border-warning text-warning hover:bg-warning/10"
            : "border-danger text-danger hover:bg-danger/10"
        }`}
      >
        {isBanned ? (
          <FiShieldOff className="w-4 h-4" />
        ) : (
          <FiShield className="w-4 h-4" />
        )}
        {isBanned ? "Unshadow Ban" : "Shadow Ban"}
      </button>

      <ConfirmationDialog
        isOpen={dialogOpen}

        title={isBanned ? "Remove Shadow Ban?" : "Apply Shadow Ban?"}
        message={
          isBanned
            ? "Are you sure you want to remove the shadow ban for this resident? They will be able to make legitimate emergency requests again."
            : `This will quarantine future emergency requests from the matching device or network for ${selectedDuration}. ${SEVERITY_OPTIONS.find((option) => option.value === selectedSeverity)?.label}.`
        }
        confirmLabel={
          isBanned
            ? isSubmitting
              ? "Removing..."
              : "Remove Shadow Ban"
            : isSubmitting
              ? "Banning..."
              : "Apply Shadow Ban"
        }
        isDestructive={!isBanned} // Applying a ban is a destructive/high-risk action
        onConfirm={handleToggle}
        onCancel={() => {
          setDialogOpen(false);
          setReason("");
        }}
        disabled={isSubmitting || (!isBanned && !reason.trim())}
      >
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
              {isBanned
                ? "Reason for removal (Optional)"
                : "Reason for shadow ban (Required)"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isBanned
                  ? "Why is this ban being lifted?"
                  : "Describe why this resident is being banned (e.g. repeated prank calls)..."
              }
              rows={3}
              className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none hover:border-foreground/20 leading-relaxed"
              required={!isBanned}
            />
          </div>

          {!isBanned && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
                  Violation category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const nextCategory = e.target
                      .value as ShadowBanViolationCategory;
                    const nextOption = CATEGORY_OPTIONS.find(
                      (option) => option.value === nextCategory,
                    );
                    setCategory(nextCategory);
                    if (nextOption?.severity) setSeverity(nextOption.severity);
                  }}
                  className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.duration})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-background-subtle bg-background-subtle/30 px-3 py-2">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
                  Policy severity
                </label>
                {selectedCategory?.severity ? (
                  <p className="text-sm text-foreground">
                    {
                      SEVERITY_OPTIONS.find(
                        (option) => option.value === selectedSeverity,
                      )?.label
                    }
                  </p>
                ) : (
                  <select
                    value={severity}
                    onChange={(e) =>
                      setSeverity(e.target.value as ShadowBanSeverity)
                    }
                    className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20 cursor-pointer"
                  >
                    {SEVERITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({SEVERITY_DURATIONS[option.value]})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="rounded-lg border border-background-subtle bg-background-subtle/30 px-3 py-2">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
                  Restriction duration (derived)
                </label>
                <p className="text-sm font-semibold text-foreground">
                  {selectedDuration}
                </p>
                <p className="text-xs text-foreground/60 mt-1">
                  Based on the Rescue Link progressive enforcement policy.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
                  Additional details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Add relevant context from the request or session."
                  rows={2}
                  className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {!isBanned && historyCount > 0 && (
            <p className="text-xs text-foreground/60">
              This resident has {historyCount} previous enforcement record
              {historyCount === 1 ? "" : "s"}.
            </p>
          )}
          {!isBanned && (
            <p className="text-xs text-foreground/60">
              Durations are an internal, proportionate safety policy based on
              intent, repetition, operational impact, and risk to emergency
              response.
            </p>
          )}
        </div>
      </ConfirmationDialog>
    </>
  );
}
