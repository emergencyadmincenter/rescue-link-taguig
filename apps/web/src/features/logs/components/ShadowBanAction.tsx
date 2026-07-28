"use client";

import React, { useState, useEffect } from "react";
import { FiShieldOff, FiShield } from "react-icons/fi";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { toast } from "react-hot-toast";
import { shadowBansApi } from "../api/shadow-bans.api";

interface ShadowBanActionProps {
  callId: string;
  isOwner: boolean;
  isAdmin: boolean;
}

export function ShadowBanAction({
  callId,
  isOwner,
  isAdmin,
}: ShadowBanActionProps) {
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<string>("permanent");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirement: Administrators must not be able to shadow ban or remove a shadow ban.
  // Requirement: Only the coordinator who owns the active communication session may perform this action.
  const canPerformAction = isOwner && !isAdmin;

  useEffect(() => {
    if (!callId) return;

    shadowBansApi
      .getStatus(callId)
      .then((status) => {
        setIsBanned(status);
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
      const durationMs = duration === "permanent" ? null : parseInt(duration, 10);
      await shadowBansApi.toggleBan(callId, action, reason, durationMs);

      toast.success(
        isBanned
          ? "Shadow ban removed successfully."
          : "Resident has been shadow banned.",
      );
      setIsBanned(!isBanned);
      setDialogOpen(false);
      setReason("");
      setDuration("permanent");
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to update shadow ban status.";
      toast.error(msg);
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
            : "Are you sure you want to silently shadow ban this resident? Future emergency requests from this device will be quarantined and hidden from all coordinators and dispatchers."
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
            <div>
              <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
                Ban Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20 cursor-pointer"
              >
                <option value="300000">5 minutes</option>
                <option value="900000">15 minutes</option>
                <option value="1800000">30 minutes</option>
                <option value="3600000">1 hour</option>
                <option value="21600000">6 hours</option>
                <option value="43200000">12 hours</option>
                <option value="86400000">24 hours</option>
                <option value="604800000">7 days</option>
                <option value="2592000000">30 days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          )}
        </div>
      </ConfirmationDialog>
    </>
  );
}
