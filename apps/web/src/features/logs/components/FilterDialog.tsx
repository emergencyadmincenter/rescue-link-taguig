'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { LogStatus, LogSource } from '../types/logs.types';
import { STATUS_CONFIG, SOURCE_CONFIG } from '../constants/logs.constants';

interface FilterState {
  status?: LogStatus;
  source?: LogSource;
}

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export default function FilterDialog({ isOpen, onClose, onApply, initialFilters }: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const statuses: LogStatus[] = ['active', 'dispatched', 'resolved', 'cancelled'];
  const sources: LogSource[] = ['manual', 'voice_call', 'chat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[360px] flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="title-small text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          {/* Status Filter */}
          <div className="mb-6">
            <p className="body-small font-semibold text-gray-900 mb-3">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => {
                const config = STATUS_CONFIG[s];
                const isActive = filters.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilters((p) => ({ ...p, status: p.status === s ? undefined : s }))}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                      isActive
                        ? `${config.borderClass} ${config.textClass} bg-opacity-5 border-2`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Filter */}
          <div className="mb-2">
            <p className="body-small font-semibold text-gray-900 mb-3">Source</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => {
                const config = SOURCE_CONFIG[s];
                const isActive = filters.source === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilters((p) => ({ ...p, source: p.source === s ? undefined : s }))}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                      isActive
                        ? 'border-primary text-primary bg-primary/5 border-2'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleClear}
            className="px-4 py-2 body-small font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 body-small font-semibold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
