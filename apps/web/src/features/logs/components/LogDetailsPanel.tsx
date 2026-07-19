"use client";

import { useState, useEffect } from "react";
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
  FiBriefcase,
  FiMapPin,
  FiTruck,
  FiBatteryCharging,
  FiX,
  FiPlus,
  FiAlignLeft,
} from "react-icons/fi";
import { Log, Resource } from "../types/logs.types";
import { logsApi } from "../api/logs.api";
import { useAutoSave } from "../hooks/useAutoSave";
import StatusSelector from "./StatusSelector";
import { toast } from "react-hot-toast";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import SelectorDialog, { SelectorOption } from "./SelectorDialog";
import { useAuth } from "@/providers/AuthProvider";

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
  { id: "custom_Food", label: "Food", icon: <FiBriefcase /> },
  { id: "custom_Drinking Water", label: "Drinking Water", icon: <FiDroplet /> },
  { id: "custom_Rescue", label: "Rescue", icon: <FiHeart /> },
  { id: "custom_First Aid", label: "First Aid", icon: <FiHeart /> },
  {
    id: "custom_Medical Assistance",
    label: "Medical Assistance",
    icon: <FiHeart />,
  },
  { id: "custom_Ambulance", label: "Ambulance", icon: <FiTruck /> },
  { id: "custom_Shelter", label: "Shelter", icon: <FiMapPin /> },
  { id: "custom_Evacuation", label: "Evacuation", icon: <FiMapPin /> },
  { id: "custom_Clothing", label: "Clothing", icon: <FiBriefcase /> },
  { id: "custom_Baby Supplies", label: "Baby Supplies", icon: <FiBriefcase /> },
  { id: "custom_Hygiene Kit", label: "Hygiene Kit", icon: <FiDroplet /> },
  { id: "custom_Transportation", label: "Transportation", icon: <FiTruck /> },
  { id: "custom_Generator", label: "Generator", icon: <FiBatteryCharging /> },
  { id: "custom_Flashlight", label: "Flashlight", icon: <FiBatteryCharging /> },
  { id: "custom_Fuel", label: "Fuel", icon: <FiBatteryCharging /> },
  { id: "custom_Oxygen", label: "Oxygen", icon: <FiWind /> },
  { id: "custom_Blood Donation", label: "Blood Donation", icon: <FiHeart /> },
];

export default function LogDetailsPanel({
  log,
  resources,
  onBack,
  onUpdate,
}: LogDetailsPanelProps) {
  const { user } = useAuth();
  const isOwner = user && log && (log.assigned_coordinator_id === user.id || log.created_by_coordinator_id === user.id);
  const isReadOnly = !isOwner;

  const [formData, setFormData] = useState({
    caller_name: "",
    caller_contact: "",
    address: "",
    description: "",
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    status: string;
  }>({ isOpen: false, status: "" });

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
        label: r.name,
        icon: <FiBriefcase />,
      }));
    return [...PREDEFINED_NEEDS_FALLBACK, ...dbNeeds];
  })();

  useEffect(() => {
    if (log) {
      setFormData({
        caller_name: log.caller_name || "",
        caller_contact: log.caller_contact || "",
        address: log.address || "",
        description: log.description || "",
      });

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
          predefined || { id: res.id, label: res.name, icon: <FiBriefcase /> }
        );
      });
      setSelectedNeeds(mappedNeeds);
    }
  }, [log]);

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
    debounceMs: 1500,
  });

  if (!log) return null;

  const handleChange = (field: string, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    const requiredFields = ["caller_name", "caller_contact", "address"];
    if (requiredFields.includes(field) && !value.trim()) return;
    debouncedSave({ [field]: value });
  };

  const executeStatusChange = async (status: string) => {
    if (isReadOnly) return;
    try {
      const updated = await logsApi.updateLog(log.id, {
        status: status as any,
      });
      onUpdate(updated);
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleStatusChange = (status: string) => {
    if (isReadOnly) return;
    if (status === "cancelled" || status === "resolved") {
      setConfirmDialog({ isOpen: true, status });
    } else {
      executeStatusChange(status);
    }
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
            minute: "2-digit",
          })}
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
          <h2 className="title-medium text-foreground">Incident Details</h2>
        </div>
        <StatusSelector
          currentStatus={log.status}
          onStatusChange={handleStatusChange}
          disabled={isReadOnly}
        />
      </div>


      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
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
                    onChange={(e) => handleChange("caller_name", e.target.value)}
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
                    onChange={(e) => handleChange("caller_contact", e.target.value)}
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
            </div>
          </section>

          <hr className="border-background-subtle/50" />

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

          <section className="mb-4">
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
        </div>


      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.status === "cancelled"
            ? "Cancel Emergency Log?"
            : "Resolve Emergency Log?"
        }
        message={
          confirmDialog.status === "cancelled"
            ? "Are you sure you want to cancel this emergency log? This action marks the request as no longer needed."
            : "Are you sure you want to resolve this emergency log? This marks the request as successfully handled."
        }
        confirmLabel={
          confirmDialog.status === "cancelled" ? "Yes, Cancel" : "Yes, Resolve"
        }
        isDestructive={confirmDialog.status === "cancelled"}
        onConfirm={() => {
          executeStatusChange(confirmDialog.status);
          setConfirmDialog({ isOpen: false, status: "" });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, status: "" })}
      />

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
