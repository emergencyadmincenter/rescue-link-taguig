"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FiChevronLeft,
  FiSettings,
  FiPhoneCall,
  FiSmartphone,
  FiMessageSquare,
  FiRadio,
  FiUser,
  FiShield,
  FiWind,
  FiHeart,
  FiDroplet,
  FiMapPin,
  FiTruck,
  FiBatteryCharging,
  FiX,
  FiPlus,
  FiAlignLeft,
  FiAlertTriangle,
  FiShare2,
  FiActivity,
  FiCpu,
  FiGlobe,
  FiClock,
  FiEye,
  FiEyeOff,
  FiShoppingBag,
  FiPackage,
  FiLifeBuoy,
  FiAlertOctagon,
  FiHome,
  FiAnchor,
  FiTarget
} from "react-icons/fi";
import { Log, LogStatus, Resource } from "../types/logs.types";
import { STATUS_CONFIG } from "../constants/logs.constants";
import { logsApi } from "../api/logs.api";
import { useAutoSave } from "../hooks/useAutoSave";
import StatusSelector from "./StatusSelector";
import { toast } from "react-hot-toast";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import SelectorDialog, { SelectorOption } from "./SelectorDialog";
import ShareLogDialog from "./ShareLogDialog";
import { useAuth } from "@/providers/AuthProvider";
import dynamic from "next/dynamic";
import { AgencyCoordinationSection } from "./AgencyCoordinationSection";
import { CoordinationUpdatesSection } from "./CoordinationUpdatesSection";

const EditPinMap = dynamic(
  () => import("./EditPinMap").then((m) => m.EditPinMap),
  { ssr: false, loading: () => null },
);

interface LogDetailsPanelProps {
  log: Log | null;
  resources: Resource[];
  onBack: () => void;
  onUpdate: (updatedLog: Log) => void;
}

const PREDEFINED_CHANNELS: SelectorOption[] = [
  { id: "hotline", label: "Emergency Hotline", icon: <FiPhoneCall /> },
  { id: "mobile", label: "Mobile Call", icon: <FiSmartphone /> },
  { id: "sms", label: "SMS", icon: <FiMessageSquare /> },
  { id: "radio", label: "Radio", icon: <FiRadio /> },
  { id: "walkin", label: "Walk-in Report", icon: <FiUser /> },
  { id: "coordinator", label: "Barangay Coordinator", icon: <FiUser /> },
  { id: "police", label: "Police", icon: <FiShield /> },
  { id: "fire", label: "Fire Department", icon: <FiWind /> },
  { id: "ambulance", label: "Ambulance", icon: <FiHeart /> },
  { id: "social", label: "Social Media", icon: <FiMessageSquare /> },
];

const PREDEFINED_NEEDS_FALLBACK: SelectorOption[] = [
  { id: "custom_Food", label: "Food", icon: <FiShoppingBag /> },
  { id: "custom_Drinking Water", label: "Drinking Water", icon: <FiDroplet /> },
  { id: "custom_Rescue", label: "Rescue", icon: <FiLifeBuoy /> },
  { id: "custom_First Aid", label: "First Aid", icon: <FiHeart /> },
  { id: "custom_Medical Assistance", label: "Medical Assistance", icon: <FiActivity /> },
  { id: "custom_Ambulance", label: "Ambulance", icon: <FiTruck /> },
  { id: "custom_Firetruck", label: "Firetruck", icon: <FiAlertOctagon /> },
  { id: "custom_Shelter", label: "Shelter", icon: <FiHome /> },
  { id: "custom_Evacuation", label: "Evacuation", icon: <FiMapPin /> },
  { id: "custom_Clothing", label: "Clothing", icon: <FiShoppingBag /> },
  { id: "custom_Baby Supplies", label: "Baby Supplies", icon: <FiPackage /> },
  { id: "custom_Rescue Boat", label: "Rescue Boat", icon: <FiAnchor /> },
  { id: "custom_Police Assistance", label: "Police Assistance", icon: <FiShield /> },
  { id: "custom_Search and Rescue", label: "Search and Rescue", icon: <FiTarget /> },
];

export default function LogDetailsPanel({
  log,
  resources,
  onBack,
  onUpdate}: LogDetailsPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("admin");
  const isOwner =
    user &&
    log &&
    !isAdmin &&
    (log.assigned_coordinator_id === user.id ||
      log.created_by_coordinator_id === user.id ||
      !log.assigned_coordinator_id);
  const isReadOnly = !isOwner;

  const [formData, setFormData] = useState({
    caller_name: "",
    caller_contact: "",
    address: "",
    description: ""});

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    status: string;
    remarks: string;
  }>({ isOpen: false, status: "", remarks: "" });

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showSecurityIdentifiers, setShowSecurityIdentifiers] = useState(false);

  // Channels
  const [selectedChannels, setSelectedChannels] = useState<SelectorOption[]>(
    [],
  );
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);

  // Needs
  const [selectedNeeds, setSelectedNeeds] = useState<SelectorOption[]>([]);
  const [isNeedsOpen, setIsNeedsOpen] = useState(false);

  const predefinedNeeds: SelectorOption[] = (() => {
    const fallbackLabels = new Set(
      PREDEFINED_NEEDS_FALLBACK.map((n) => n.label.toLowerCase()),
    );
    const dbNeeds: SelectorOption[] = resources
      .filter((r) => !fallbackLabels.has(r.name.toLowerCase()))
      .map((r) => ({
        id: r.id,
        label: r.name}));
    return [...PREDEFINED_NEEDS_FALLBACK, ...dbNeeds];
  })();

  const initializedLogId = useRef<string | null>(null);

  useEffect(() => {
    if (log && initializedLogId.current !== log.id) {
      initializedLogId.current = log.id;
      setFormData({
        caller_name: log.caller_name || "",
        caller_contact: log.caller_contact || "",
        address: log.address || "",
        description: log.description || ""});

      // Map existing channels
      const dbChannels = log.channels || [];
      const mappedChannels = dbChannels.map((ch: string) => {
        const predefined = PREDEFINED_CHANNELS.find(
          (p) => p.label.toLowerCase() === ch.toLowerCase(),
        );
        return predefined || { id: `custom_${ch}`, label: ch };
      });
      setSelectedChannels(mappedChannels);

      // Map existing needs
      const dbNeeds = log.resource_assignments?.map((ra) => ra.resource) || [];
      const mappedNeeds = dbNeeds.map((res) => {
        const predefined = predefinedNeeds.find(
          (p) =>
            p.id === res.id || p.label.toLowerCase() === res.name.toLowerCase(),
        );
        return (
          predefined || { id: res.id, label: res.name }
        );
      });
      setSelectedNeeds(mappedNeeds);
    }
  }, [log, predefinedNeeds]);

  const { debouncedSave, immediateSave } = useAutoSave({
    onSave: async (data) => {
      if (!log) return;
      try {
        const updated = await logsApi.updateLog(log.id, data);
        onUpdate(updated);
      } catch (e) {
        toast.error("Failed to save changes");
      }
    },
    debounceMs: 1500});

  if (!log) return null;

  const shadowBan = log.is_shadow_banned ? log.shadow_ban_details : null;

  const handleChange = (field: string, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    const requiredFields = ["caller_name", "caller_contact", "address"];
    if (requiredFields.includes(field) && !value.trim()) return;
    debouncedSave({ [field]: value });
  };

  const handlePinSave = async (lat: number, lng: number) => {
    if (!log) return;
    try {
      const updated = await logsApi.updateLog(log.id, {
        latitude: lat,
        longitude: lng});
      onUpdate(updated);
      toast.success("Pin location updated.");
    } catch {
      toast.error("Failed to update pin location.");
    }
  };

  const executeStatusChange = async (status: LogStatus, remarks?: string) => {
    if (isReadOnly) return;
    try {
      const updated = await logsApi.updateLog(log.id, {
        status,
        status_remarks:
          remarks?.trim() || `Status changed from ${log.status} to ${status}.`});
      const refreshed = await logsApi.getLog(updated.id);
      onUpdate(refreshed);
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleStatusChange = (status: string) => {
    if (isReadOnly) return;
    setConfirmDialog({ isOpen: true, status, remarks: "" });
  };

  const toggleChannel = (id: string) => {
    if (isReadOnly) return;
    let newChannels = [...selectedChannels];
    if (newChannels.find((c) => c.id === id)) {
      newChannels = newChannels.filter((c) => c.id !== id);
    } else {
      const opt = PREDEFINED_CHANNELS.find((o) => o.id === id);
      if (opt) newChannels.push(opt);
    }
    setSelectedChannels(newChannels);
    immediateSave({ channels: newChannels.map((c) => c.label) });
  };

  const removeChannel = (id: string) => {
    if (isReadOnly) return;
    const newChannels = selectedChannels.filter((c) => c.id !== id);
    setSelectedChannels(newChannels);
    immediateSave({ channels: newChannels.map((c) => c.label) });
  };

  const addCustomChannel = (label: string) => {
    if (isReadOnly) return;
    const id = `custom_${label}`;
    const newChannels = [...selectedChannels, { id, label }];
    setSelectedChannels(newChannels);
    immediateSave({ channels: newChannels.map((c) => c.label) });
  };

  const toggleNeed = (id: string) => {
    if (isReadOnly) return;
    let newNeeds = [...selectedNeeds];
    if (newNeeds.find((n) => n.id === id)) {
      newNeeds = newNeeds.filter((n) => n.id !== id);
    } else {
      const opt = predefinedNeeds.find((o) => o.id === id);
      if (opt) newNeeds.push(opt);
    }
    setSelectedNeeds(newNeeds);
    immediateSave({ resource_ids: newNeeds.map((n) => n.id) });
  };

  const removeNeed = (id: string) => {
    if (isReadOnly) return;
    const newNeeds = selectedNeeds.filter((n) => n.id !== id);
    setSelectedNeeds(newNeeds);
    immediateSave({ resource_ids: newNeeds.map((n) => n.id) });
  };

  const addCustomNeed = (label: string) => {
    if (isReadOnly) return;
    const id = `custom_${label}`;
    const newNeeds = [...selectedNeeds, { id, label }];
    setSelectedNeeds(newNeeds);
    immediateSave({ resource_ids: newNeeds.map((n) => n.id) });
  };

  const renderMetadata = () => (
    <div className="grid grid-cols-2 gap-3 mb-8">
      <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-background-subtle/40 border border-background-subtle/50">
        <span className="body-xsmall text-foreground/50 font-medium uppercase tracking-wider">
          Request ID
        </span>
        <span className="font-mono text-foreground font-semibold title-small">
          {log.reference_no}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-background-subtle/40 border border-background-subtle/50">
        <span className="body-xsmall text-foreground/50 font-medium uppercase tracking-wider">
          Received
        </span>
        <span className="text-foreground font-semibold title-small">
          {new Date(log.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"})}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-background-subtle/40 border border-background-subtle/50 col-span-2">
        <span className="body-xsmall text-foreground/50 font-medium uppercase tracking-wider">
          Managed by
        </span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FiUser className="w-3.5 h-3.5" />
          </div>
          <span className="text-foreground font-semibold">
            {log.assigned_coordinator?.name || "Unassigned"}
          </span>
        </div>
      </div>

      {log.calls && log.calls.length > 0 && (
        <div className="col-span-2 mt-2">
          <p className="body-xsmall text-foreground/50 font-medium uppercase tracking-wider mb-2">
            Related Communication Session
          </p>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-background-subtle/30 border border-background-subtle/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {log.calls[0].communication_method === "voice" ? (
                  <FiPhoneCall />
                ) : (
                  <FiMessageSquare />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  {log.calls[0].communication_method === "voice"
                    ? "Voice Call"
                    : "Chat"}
                </span>
                <span className="body-small text-foreground/60 font-mono">
                  Session #CALL-{log.calls[0].id.substring(0, 5).toUpperCase()}
                </span>
              </div>
            </div>
            <a
              href={`/calls/${log.calls[0].id}`}
              className="text-primary hover:text-primary-hover font-medium body-small px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
            >
              View Session &rarr;
            </a>
          </div>
        </div>
      )}

      {log.source === "manual" && (!log.calls || log.calls.length === 0) && (
        <div className="col-span-2 mt-2">
          <p className="body-xsmall text-foreground/50 font-medium uppercase tracking-wider mb-2">
            Source Information
          </p>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-background-subtle/30 border border-background-subtle/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FiAlignLeft />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  Manually Created Log
                </span>
                <span className="body-small text-foreground/60">
                  Entered directly by a coordinator
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-background-subtle/50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-background-subtle transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-1">
            <h2 className="title-medium text-foreground leading-none">
              Incident Details
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShareDialogOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors tooltip-trigger relative group"
            title="Share Public Link"
          >
            <FiShare2 className="w-5 h-5" />
          </button>
          <StatusSelector
            currentStatus={log.status}
            onStatusChange={handleStatusChange}
            disabled={isReadOnly}
          />
        </div>
      </div>

      <ShareLogDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        logId={log.id}
        initialToken={log.public_token}
        onTokenGenerated={(token) => {
          onUpdate({ ...log, public_token: token });
        }}
      />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar pt-6">
        {shadowBan && (
          <section className="mb-6 overflow-hidden rounded-xl border-2 border-danger/30 bg-danger/5 text-danger shadow-sm">
            <div className="flex items-start gap-3 border-b border-danger/20 bg-danger/10 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
                <FiShield className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm">Active Shadow Ban</h3>
                  {shadowBan.severity && (
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                      {shadowBan.severity}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs opacity-90">
                  Future requests matching this resident&apos;s security
                  identifiers are quarantined from normal dispatch.
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                <span className="block font-semibold opacity-70">
                  Restriction
                </span>
                <span className="font-semibold">
                  {shadowBan.expires_at
                    ? `Until ${new Date(shadowBan.expires_at).toLocaleString()}`
                    : "Indefinite"}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg border border-danger/15 bg-white/70 p-3">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-70">
                      Enforcement reason
                    </span>
                    <p className="mt-1 text-sm font-semibold">
                      {shadowBan.reason}
                    </p>
                    {shadowBan.details && (
                      <p className="mt-1 text-xs opacity-80">
                        {shadowBan.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {shadowBan.violation_category && (
                  <div className="rounded-lg border border-danger/15 bg-white/60 p-3">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-70">
                      Violation category
                    </span>
                    <span className="mt-1 block text-sm font-medium capitalize">
                      {shadowBan.violation_category.replaceAll("_", " ")}
                    </span>
                  </div>
                )}
                <div className="rounded-lg border border-danger/15 bg-white/60 p-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    Applied by
                  </span>
                  <span className="mt-1 block text-sm font-medium">
                    {shadowBan.coordinator?.name || "Unknown"}
                  </span>
                </div>
                <div className="rounded-lg border border-danger/15 bg-white/60 p-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    Applied
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-sm font-medium">
                    <FiClock className="h-3.5 w-3.5" />
                    {new Date(shadowBan.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {shadowBan.security_context && (
                <div className="rounded-lg border border-danger/15 bg-white/60 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <FiActivity className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      Security context
                    </h4>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] opacity-70">
                        Authorized staff only
                      </span>
                      {(shadowBan.security_context.device_uuid_full ||
                        shadowBan.security_context.fingerprint_hash_full) && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecurityIdentifiers((visible) => !visible)
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-danger/20 px-2 py-1 text-[11px] font-semibold hover:bg-danger/10 transition-colors"
                          aria-pressed={showSecurityIdentifiers}
                        >
                          {showSecurityIdentifiers ? (
                            <FiEyeOff className="h-3 w-3" />
                          ) : (
                            <FiEye className="h-3 w-3" />
                          )}
                          {showSecurityIdentifiers
                            ? "Hide full IDs"
                            : "Show full IDs"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                        <FiGlobe className="h-3 w-3" /> Client IP
                      </span>
                      <span className="mt-1 block font-mono text-xs">
                        {shadowBan.security_context.client_ip}
                      </span>
                    </div>
                    <div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                        <FiCpu className="h-3 w-3" /> Device ID
                      </span>
                      <span className="mt-1 block break-all font-mono text-xs">
                        {(showSecurityIdentifiers
                          ? shadowBan.security_context.device_uuid_full
                          : shadowBan.security_context.device_uuid) ||
                          "Not available"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                        Fingerprint
                      </span>
                      <span className="mt-1 block break-all font-mono text-xs">
                        {(showSecurityIdentifiers
                          ? shadowBan.security_context.fingerprint_hash_full
                          : shadowBan.security_context.fingerprint_hash) ||
                          "Not available"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                        Risk classification
                      </span>
                      <span className="mt-1 block text-xs font-semibold">
                        {shadowBan.security_context.risk_classification ===
                        "high_fraud_risk"
                          ? "High fraud risk"
                          : "Low risk"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                        Network signals
                      </span>
                      <span className="mt-1 block text-xs">
                        {[
                          shadowBan.security_context.is_vpn && "VPN",
                          shadowBan.security_context.is_proxy && "Proxy",
                          shadowBan.security_context.is_hosting && "Hosting",
                        ]
                          .filter(Boolean)
                          .join(", ") || "None detected"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                        Location consistency
                      </span>
                      <span className="mt-1 block text-xs">
                        {shadowBan.security_context.distance_km !== null
                          ? `${Number(shadowBan.security_context.distance_km).toFixed(1)} km from IP location`
                          : shadowBan.security_context
                                .location_permission_granted || (log.latitude && log.longitude)
                            ? "Location available; no distance recorded"
                            : "Location permission not granted"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] opacity-70">
                    Fraud assessment recorded{" "}
                    {new Date(
                      shadowBan.security_context.assessed_at,
                    ).toLocaleString()}
                    . These signals support review and are not, by themselves,
                    proof of intentional misconduct.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-6 rounded-xl border border-background-subtle bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-background-subtle/60 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Status History
              </h3>
              <p className="mt-1 text-xs text-foreground/50">
                Chronological record of this Log&apos;s status progression.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CONFIG[log.status].subtleBgClass} ${STATUS_CONFIG[log.status].subtleTextClass}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[log.status].dotClass}`}
                aria-hidden="true"
              />
              Current: {STATUS_CONFIG[log.status].label}
            </span>
          </div>

          {log.status_history && log.status_history.length > 0 ? (
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar px-5 py-4">
              <div className="relative space-y-5">
                <div className="absolute bottom-3 left-[7px] top-3 w-px bg-background-subtle" />
                {log.status_history.map((entry, index) => {
                  const isCurrent =
                    index === log.status_history!.length - 1 &&
                    entry.new_status === log.status;
                  const newLabel =
                    STATUS_CONFIG[entry.new_status]?.label ?? entry.new_status;
                  const previousLabel = entry.previous_status
                    ? (STATUS_CONFIG[entry.previous_status]?.label ??
                      entry.previous_status)
                    : null;

                  return (
                    <div key={entry.id} className="relative flex gap-3">
                      <div
                        className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white ${STATUS_CONFIG[entry.new_status]?.dotClass ?? "bg-gray-300"} ${isCurrent ? "ring-2 ring-primary/20" : ""}`}
                      />
                      <div className="min-w-0 flex-1 rounded-lg border border-background-subtle/70 bg-background-subtle/20 px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {previousLabel
                              ? `${previousLabel} → ${newLabel}`
                              : `Created as ${newLabel}`}
                            {isCurrent && (
                              <span
                                className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CONFIG[log.status].subtleBgClass} ${STATUS_CONFIG[log.status].subtleTextClass}`}
                              >
                                <span
                                  className={`w-1 h-1 rounded-full ${STATUS_CONFIG[log.status].dotClass}`}
                                  aria-hidden="true"
                                />
                                Current
                              </span>
                            )}
                          </p>
                          <time
                            className="text-xs text-foreground/50"
                            dateTime={entry.changed_at}
                          >
                            {new Date(entry.changed_at).toLocaleString()}
                          </time>
                        </div>
                        <p className="mt-1 text-xs text-foreground/60">
                          {entry.changed_by?.name || "System"}
                        </p>
                        {entry.remarks && (
                          <p className="mt-2 text-xs italic text-foreground/70">
                            {entry.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="px-5 py-5 text-xs text-foreground/60">
              No status history was recorded for this Log. Status changes made
              before history tracking was enabled are unavailable.
            </div>
          )}
        </section>

        {isReadOnly && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3 text-warning-hover shadow-sm">
            <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">View-Only Mode</h3>
              <p className="text-xs mt-0.5 opacity-90 text-warning-hover">
                This log is currently owned by{" "}
                {log.assigned_coordinator?.name || "another coordinator"}. You
                cannot make changes to it.
              </p>
            </div>
          </div>
        )}
        {renderMetadata()}

        <div className="w-full space-y-6 pb-8">
          {/* Caller Information Card */}
          <section className="bg-white rounded-xl border border-background-subtle shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-background-subtle/50 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FiUser className="text-primary w-4 h-4" />
                Caller Information
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-foreground/30 w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.caller_name}
                    onChange={(e) =>
                      handleChange("caller_name", e.target.value)
                    }
                    disabled={isReadOnly}
                    placeholder="e.g. John Doe"
                    className="w-full bg-background border border-background-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20 disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1">
                  Contact Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhoneCall className="text-foreground/30 w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.caller_contact}
                    onChange={(e) =>
                      handleChange("caller_contact", e.target.value)
                    }
                    disabled={isReadOnly}
                    placeholder="e.g. 09123456789"
                    className="w-full bg-background border border-background-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all hover:border-foreground/20 disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Incident Details Card */}
          <section className="bg-white rounded-xl border border-background-subtle shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-background-subtle/50 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FiAlignLeft className="text-primary w-4 h-4" />
                Incident Details
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1">
                  Address / Location
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-0 pl-3 flex items-start pointer-events-none">
                    <FiMapPin className="text-foreground/30 w-4 h-4" />
                  </div>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Exact location..."
                    rows={2}
                    className="w-full bg-background border border-background-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none hover:border-foreground/20 disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 pl-1 flex justify-between items-center">
                  <span>Description</span>
                </label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Provide any additional context or details..."
                  className="w-full bg-background border border-background-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none hover:border-foreground/20 leading-relaxed disabled:opacity-70"
                />
              </div>

              {/* Pin Location */}
              <div>
                <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2 pl-1">
                  GPS Pin Location
                </label>
                <EditPinMap
                  initialLat={log.latitude}
                  initialLng={log.longitude}
                  barangay={log.barangay ?? ""}
                  onSave={handlePinSave}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </section>

          <hr className="border-background-subtle/50" />

          <section className="mb-8">
            <h3 className="text-xs font-bold text-info uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiRadio className="w-4 h-4" /> Channels
            </h3>
            <div>
              <div className="flex flex-wrap gap-2.5">
                {selectedChannels.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-info/5 text-info border border-info/10 body-small font-medium transition-colors"
                  >
                    {c.icon && (
                      <span className="opacity-70 shrink-0">{c.icon}</span>
                    )}
                    <span className="truncate max-w-[160px]">{c.label}</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeChannel(c.id)}
                        className="opacity-50 hover:opacity-100 hover:text-info ml-1 shrink-0 p-0.5 rounded-full transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </span>
                ))}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsChannelsOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-dashed border-background-subtle text-foreground/50 hover:border-foreground/40 hover:text-foreground/80 hover:bg-background-subtle/30 body-small font-medium transition-all shrink-0"
                  >
                    <FiPlus className="w-4 h-4" /> Add Channel
                  </button>
                )}
              </div>
              {selectedChannels.length === 0 && (
                <p className="body-small text-foreground/40 mt-3 italic pl-1">
                  No communication channels added.
                </p>
              )}
            </div>
          </section>
          <section>
            <h3 className="text-xs font-bold text-danger uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Requested Needs
            </h3>
            <div>
              <div className="flex flex-wrap gap-2.5">
                {selectedNeeds.map((n) => (
                  <span
                    key={n.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-danger/5 text-danger border border-danger/10 body-small font-medium transition-colors"
                  >
                    {n.icon && (
                      <span className="opacity-70 shrink-0">{n.icon}</span>
                    )}
                    <span className="truncate max-w-[160px]">{n.label}</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeNeed(n.id)}
                        className="opacity-50 hover:opacity-100 hover:text-danger ml-1 shrink-0 p-0.5 rounded-full transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </span>
                ))}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsNeedsOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-dashed border-background-subtle text-foreground/50 hover:border-foreground/40 hover:text-foreground/80 hover:bg-background-subtle/30 body-small font-medium transition-all shrink-0"
                  >
                    <FiPlus className="w-4 h-4" /> Add Need
                  </button>
                )}
              </div>
              {selectedNeeds.length === 0 && (
                <p className="body-small text-foreground/40 mt-3 italic pl-1">
                  No resources or needs requested.
                </p>
              )}
            </div>
          </section>

          <hr className="border-background-subtle/50" />

          <section className="mb-4 pt-2">
            <AgencyCoordinationSection
              logId={log.id}
              isReadOnly={isReadOnly}
              updateTrigger={log.resource_assignments
                ?.map((ra) => ra.resource_id)
                .join(",")}
            />
          </section>

          <hr className="border-background-subtle/50" />

          <section className="mb-4 pt-2">
            <CoordinationUpdatesSection
              logId={log.id}
              isReadOnly={isReadOnly}
            />
          </section>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.status === "cancelled"
            ? "Cancel Emergency Log?"
            : confirmDialog.status === "resolved"
              ? "Resolve Emergency Log?"
              : confirmDialog.status === "dispatched"
                ? "Dispatch Emergency Log?"
                : confirmDialog.status === "active"
                  ? "Set Log to Active?"
                  : "Change Status?"
        }
        message={
          confirmDialog.status === "cancelled"
            ? "Are you sure you want to cancel this emergency log? This action marks the request as no longer needed."
            : confirmDialog.status === "resolved"
              ? "Are you sure you want to resolve this emergency log? This marks the request as successfully handled."
              : confirmDialog.status === "dispatched"
                ? "Are you sure you want to mark this log as dispatched? This indicates that responders have been deployed to the incident."
                : confirmDialog.status === "active"
                  ? "Are you sure you want to set this log back to active? This indicates the incident still requires attention."
                  : "Are you sure you want to change the status of this log?"
        }
        confirmLabel={
          confirmDialog.status === "cancelled"
            ? "Yes, Cancel"
            : confirmDialog.status === "resolved"
              ? "Yes, Resolve"
              : confirmDialog.status === "dispatched"
                ? "Yes, Dispatch"
                : confirmDialog.status === "active"
                  ? "Yes, Set Active"
                  : "Confirm"
        }
        isDestructive={confirmDialog.status === "cancelled"}
        onConfirm={() => {
          executeStatusChange(
            confirmDialog.status as LogStatus,
            confirmDialog.remarks,
          );
          setConfirmDialog({ isOpen: false, status: "", remarks: "" });
        }}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, status: "", remarks: "" })
        }
      >
        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Remarks (Optional)
          </label>
          <textarea
            value={confirmDialog.remarks}
            onChange={(event) =>
              setConfirmDialog((current) => ({
                ...current,
                remarks: event.target.value}))
            }
            rows={2}
            placeholder="Add context for this status change..."
            className="w-full resize-none rounded-lg border border-background-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </ConfirmationDialog>

      <SelectorDialog
        isOpen={isNeedsOpen}
        onClose={() => setIsNeedsOpen(false)}
        title="Select Needs"
        options={predefinedNeeds}
        selectedIds={selectedNeeds.map((n) => n.id)}
        onSelect={toggleNeed}
        onAddCustom={addCustomNeed}
      />

      <SelectorDialog
        isOpen={isChannelsOpen}
        onClose={() => setIsChannelsOpen(false)}
        title="Select Channels"
        options={PREDEFINED_CHANNELS}
        selectedIds={selectedChannels.map((c) => c.id)}
        onSelect={toggleChannel}
        onAddCustom={addCustomChannel}
      />
    </div>
  );
}
