"use client";

import { useState, useMemo } from "react";
import { FiX, FiSearch, FiPlus, FiCheck } from "react-icons/fi";

export interface SelectorOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: SelectorOption[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onAddCustom: (label: string) => void;
}

export default function SelectorDialog({
  isOpen,
  onClose,
  title,
  options,
  selectedIds,
  onSelect,
  onAddCustom,
}: SelectorDialogProps) {
  const [search, setSearch] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search]);

  if (!isOpen) return null;

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onAddCustom(customValue.trim());
      setCustomValue("");
      setIsAddingCustom(false);
      onClose(); // Automatically close dialog on custom add
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[480px] rounded-xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ height: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="title-small text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "16px 24px 16px 12px" }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg body-small focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-primary/20 transition-all text-gray-700"
            />
            <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[15px] h-[15px]" />
          </div>
        </div>

        {/* Grid List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {filteredOptions.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="body-small font-medium truncate">
                      {opt.label}
                    </span>
                  </div>
                  {isSelected && <FiCheck className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          {filteredOptions.length === 0 && !search && (
            <div className="text-center py-8 text-gray-500 body-small">
              No options available.
            </div>
          )}
        </div>

        {/* Footer: Other */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
          {!isAddingCustom ? (
            <button
              onClick={() => setIsAddingCustom(true)}
              className="flex items-center gap-2 text-primary hover:text-primary-hover body-small font-medium transition-colors"
            >
              <FiPlus className="w-4 h-4" /> Add Other
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Enter custom item..."
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md body-small focus:outline-none focus:border-gray-300 text-gray-900"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customValue.trim()}
                className="px-4 py-2 bg-primary text-white rounded-md body-small font-medium disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setIsAddingCustom(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-md body-small font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
