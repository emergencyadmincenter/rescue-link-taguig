'use client';

import { useState } from 'react';
import { FiX, FiCalendar } from 'react-icons/fi';
import { DATE_PRESETS } from '../constants/logs.constants';

interface DateRangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dateFrom?: string, dateTo?: string, label?: string) => void;
  currentLabel: string;
}

function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(today);
  to.setDate(to.getDate() + 1);

  switch (preset) {
    case 'today':
      return { from: today.toISOString(), to: to.toISOString() };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y.toISOString(), to: today.toISOString() };
    }
    case 'last_7_days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString(), to: to.toISOString() };
    }
    case 'last_30_days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString(), to: to.toISOString() };
    }
    case 'this_month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: d.toISOString(), to: to.toISOString() };
    }
    default:
      return { from: '', to: '' };
  }
}

export default function DateRangeDialog({ isOpen, onClose, onApply, currentLabel }: DateRangeDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  if (!isOpen) return null;

  const handlePresetClick = (preset: string) => {
    if (preset === 'custom') {
      setSelectedPreset('custom');
      return;
    }
    const { from, to } = getDateRange(preset);
    const label = DATE_PRESETS.find((p) => p.value === preset)?.label || '';
    onApply(from, to, label);
    onClose();
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onApply(new Date(customFrom).toISOString(), new Date(customTo).toISOString(), `${customFrom} – ${customTo}`);
      onClose();
    }
  };

  const handleClear = () => {
    onApply(undefined, undefined, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[360px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-gray-700" />
            <h2 className="title-small text-gray-900">Date Range</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Presets */}
        <div className="p-6 flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[50vh]">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`w-full text-left px-4 py-2 rounded-md body-small font-medium transition-colors ${
                selectedPreset === preset.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Range */}
        {selectedPreset === 'custom' && (
          <div className="px-6 pb-6 flex flex-col gap-3 border-t border-gray-100 pt-4">
            <div className="flex gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md body-small focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md body-small focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-700"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customFrom || !customTo}
              className="w-full py-2 bg-primary text-white rounded-md body-small font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              Apply Range
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-4 pt-2">
          <button
            onClick={handleClear}
            className="w-full py-2 rounded-md text-gray-500 font-medium body-small hover:text-gray-700 hover:bg-gray-50 transition-colors border border-transparent"
          >
            Clear Date Filter
          </button>
        </div>
      </div>
    </div>
  );
}
