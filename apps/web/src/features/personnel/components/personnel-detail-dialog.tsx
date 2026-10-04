"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiClock,
  FiEdit2,
} from "react-icons/fi";
import { MdCheckCircle } from "react-icons/md";
import { PersonnelEntry as ApiPersonnelItem } from "../types/personnel.types";

interface PersonnelDetailDialogProps {
  isOpen: boolean;
  person: ApiPersonnelItem | null;
  role: string;
  onClose: () => void;
  onEdit: (person: ApiPersonnelItem) => void;
}

export function PersonnelDetailDialog({
  isOpen,
  person,
  role,
  onClose,
  onEdit,
}: PersonnelDetailDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !person || !mounted) return null;

  const initials = (() => {
    const parts = person.name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  })();

  const statusConfig = {
    active: {
      label: "Active",
      dotClass: "bg-success",
      badgeClass: "bg-success/10 text-success",
      icon: <MdCheckCircle className="w-3.5 h-3.5" />,
    },
    pending_activation: {
      label: "Pending Activation",
      dotClass: "bg-warning",
      badgeClass: "bg-warning/10 text-warning",
      icon: <div className="w-2 h-2 rounded-full bg-warning shrink-0" />,
    },
    inactive: {
      label: "Inactive",
      dotClass: "bg-gray-400",
      badgeClass: "bg-gray-100 text-gray-500",
      icon: <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />,
    },
  };

  const status = statusConfig[person.status];

  const formattedDate = (() => {
    try {
      return new Date(person.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  })();

  const formattedTime = (() => {
    try {
      return new Date(person.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-[480px] overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personnel-detail-title"
      >
        {/* Header with gradient accent */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
            aria-label="Close"
          >
            <FiX className="w-4 h-4" />
          </button>

          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center">
            <div className="w-[72px] h-[72px] rounded-full bg-primary-subtle border-[3px] border-white shadow-md flex items-center justify-center text-primary font-bold title-medium mb-3">
              {initials}
            </div>
            <h2
              id="personnel-detail-title"
              className="title-small text-gray-900"
            >
              {person.name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="body-small text-gray-500 capitalize">{role}</span>
              <span className="text-gray-300">·</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full body-xsmall font-medium ${status.badgeClass}`}
              >
                {status.icon}
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          {/* Contact Information */}
          <div className="mb-5">
            <h3 className="body-xsmall font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon={<FiMail className="w-4 h-4" />}
                label="Email"
                value={person.email}
              />
              <DetailRow
                icon={<FiPhone className="w-4 h-4" />}
                label="Phone"
                value={person.phone || "Not provided"}
                muted={!person.phone}
              />
              <DetailRow
                icon={<FiMapPin className="w-4 h-4" />}
                label="Location"
                value={person.location || "Not assigned"}
                muted={!person.location}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Account Details */}
          <div className="mb-5">
            <h3 className="body-xsmall font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Account Details
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon={<FiShield className="w-4 h-4" />}
                label="Role"
                value={role}
                capitalize
              />
              <DetailRow
                icon={<FiCalendar className="w-4 h-4" />}
                label="Date Added"
                value={formattedDate}
              />
              <DetailRow
                icon={<FiClock className="w-4 h-4" />}
                label="Time Added"
                value={formattedTime}
              />
            </div>
          </div>

          {person.status === "active" && person.lastActive && (
            <>
              <div className="border-t border-gray-100 my-4" />
              <div>
                <h3 className="body-xsmall font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Activity
                </h3>
                <DetailRow
                  icon={<FiClock className="w-4 h-4" />}
                  label="Last Active"
                  value={(() => {
                    try {
                      return new Date(person.lastActive!).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      );
                    } catch {
                      return "—";
                    }
                  })()}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 body-small font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onEdit(person);
              onClose();
            }}
            className="px-4 py-2 body-small font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
            Edit Details
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---- Detail Row Component ---- */
interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
  capitalize?: boolean;
}

function DetailRow({
  icon,
  label,
  value,
  muted = false,
  capitalize = false,
}: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="body-xsmall text-gray-400 font-medium">{label}</span>
        <span
          className={`body-small break-all ${
            muted ? "text-gray-400 italic" : "text-gray-900"
          } ${capitalize ? "capitalize" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
