"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiPlus,
  FiAlertCircle,
  FiPhoneCall,
  FiMessageSquare,
  FiSmartphone,
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
  FiVideo,
} from "react-icons/fi";
import { logsApi } from "../api/logs.api";
import { Resource, CreateLogPayload } from "../types/logs.types";
import { toast } from "react-hot-toast";
import SelectorDialog, { SelectorOption } from "./SelectorDialog";
import StatusSelector from "./StatusSelector";
import { LogStatus } from "../types/logs.types";

interface ManualLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resources: Resource[];
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

// If database resources are empty, we fall back to these robust default needs
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

export default function ManualLogDialog({
  isOpen,
  onClose,
  onSuccess,
  resources,
}: ManualLogDialogProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<LogStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [selectedNeeds, setSelectedNeeds] = useState<SelectorOption[]>([]);
  const [isNeedsOpen, setIsNeedsOpen] = useState(false);

  const [selectedChannels, setSelectedChannels] = useState<SelectorOption[]>(
    [],
  );
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);

  const predefinedNeeds: SelectorOption[] = (() => {
    const fallbackLabels = new Set(
      PREDEFINED_NEEDS_FALLBACK.map((n) => n.label.toLowerCase())
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
    if (!isOpen) {
      setName("");
      setContact("");
      setAddress("");
      setDescription("");
      setStatus("active");
      setSelectedNeeds([]);
      setSelectedChannels([]);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = "Name is required";
    if (!contact) newErrors.contact = "Contact is required";
    if (!address) newErrors.address = "Location is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLogPayload = {
        caller_name: name,
        caller_contact: contact,
        address,
        description,
        resource_ids:
          selectedNeeds.length > 0 ? selectedNeeds.map((n) => n.id) : undefined,
        channels:
          selectedChannels.length > 0
            ? selectedChannels.map((c) => c.label)
            : undefined,
        status,
      };
      await logsApi.createLog(payload);
      toast.success("Emergency log created successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create emergency log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeNeed = (id: string) => {
    setSelectedNeeds((prev) => prev.filter((n) => n.id !== id));
  };

  const removeChannel = (id: string) => {
    setSelectedChannels((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-[420px] flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-[18px] h-[18px] text-gray-700" />
              <h2 className="title-small text-gray-900">Add Log Emergency</h2>
            </div>
            <StatusSelector currentStatus={status} onStatusChange={setStatus} />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <form
              id="manual-log-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Inputs */}
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((p) => ({ ...p, name: "" }));
                  }}
                  className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
                />
                {errors.name && (
                  <p className="text-danger body-xsmall mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Contact number"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setErrors((p) => ({ ...p, contact: "" }));
                  }}
                  className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
                />
                {errors.contact && (
                  <p className="text-danger body-xsmall mt-1">
                    {errors.contact}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Location"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setErrors((p) => ({ ...p, address: "" }));
                  }}
                  className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
                />
                {errors.address && (
                  <p className="text-danger body-xsmall mt-1">
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Emergency description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent resize-none transition-colors"
                />
              </div>

              {/* Channels Section */}
              <div className="pt-2">
                <p className="body-xsmall font-medium text-gray-500 mb-2">
                  Channels
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  style={{ overflow: "auto" }}
                >
                  {selectedChannels.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 body-xsmall font-medium border border-gray-200 max-w-full"
                    >
                      {c.icon && (
                        <span className="text-gray-500 shrink-0">{c.icon}</span>
                      )}
                      <span className="truncate max-w-[140px]">{c.label}</span>
                      <button
                        type="button"
                        onClick={() => removeChannel(c.id)}
                        className="text-gray-400 hover:text-primary ml-1 shrink-0"
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsChannelsOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 body-xsmall font-medium transition-colors shrink-0"
                  >
                    <FiPlus className="w-3 h-3" /> Add Channel
                  </button>
                </div>
              </div>

              {/* Needs Section */}
              <div className="pt-2 ">
                <p className="body-xsmall font-medium text-gray-500 mb-2">
                  Needs
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  style={{ overflow: "auto" }}
                >
                  {selectedNeeds.map((n) => (
                    <span
                      key={n.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full body-xsmall font-medium max-w-full bg-gray-100 text-gray-700 border border-dashed border-gray-300"
                    >
                      {n.icon && (
                        <span className="opacity-80 shrink-0">{n.icon}</span>
                      )}
                      <span className="truncate max-w-[140px]">{n.label}</span>
                      <button
                        type="button"
                        onClick={() => removeNeed(n.id)}
                        className="text-gray-400 hover:text-primary ml-1 shrink-0"
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsNeedsOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 body-xsmall font-medium transition-colors shrink-0"
                  >
                    <FiPlus className="w-3 h-3" /> Add Need
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 body-small font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="manual-log-form"
              disabled={isSubmitting}
              className="px-6 py-2 body-small font-semibold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 min-w-[80px]"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      <SelectorDialog
        isOpen={isNeedsOpen}
        onClose={() => setIsNeedsOpen(false)}
        title="Select Needs"
        options={predefinedNeeds}
        selectedIds={selectedNeeds.map((n) => n.id)}
        onSelect={(id) => {
          if (selectedNeeds.find((n) => n.id === id)) {
            removeNeed(id);
          } else {
            const opt = predefinedNeeds.find((o) => o.id === id);
            if (opt) setSelectedNeeds((p) => [...p, opt]);
          }
        }}
        onAddCustom={(label) => {
          const id = `custom_${label}`;
          setSelectedNeeds((p) => [...p, { id, label }]);
        }}
      />

      <SelectorDialog
        isOpen={isChannelsOpen}
        onClose={() => setIsChannelsOpen(false)}
        title="Select Channels"
        options={PREDEFINED_CHANNELS}
        selectedIds={selectedChannels.map((c) => c.id)}
        onSelect={(id) => {
          if (selectedChannels.find((c) => c.id === id)) {
            removeChannel(id);
          } else {
            const opt = PREDEFINED_CHANNELS.find((o) => o.id === id);
            if (opt) setSelectedChannels((p) => [...p, opt]);
          }
        }}
        onAddCustom={(label) => {
          const id = `custom_${label}`;
          setSelectedChannels((p) => [...p, { id, label }]);
        }}
      />
    </>
  );
}
