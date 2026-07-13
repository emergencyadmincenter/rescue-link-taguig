'use client';

import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { LogStatus } from '../types/logs.types';
import { STATUS_CONFIG } from '../constants/logs.constants';

interface StatusSelectorProps {
  currentStatus: LogStatus;
  onStatusChange: (status: LogStatus) => void;
  disabled?: boolean;
}

export default function StatusSelector({ currentStatus, onStatusChange, disabled }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = STATUS_CONFIG[currentStatus];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statuses: LogStatus[] = ['active', 'dispatched', 'resolved', 'cancelled'];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold transition-all ${
          config.borderClass
        } ${config.textClass} hover:opacity-80`}
      >
        {config.label}
        <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {statuses.map((s) => {
            const sc = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => { onStatusChange(s); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-background-subtle transition-colors flex items-center gap-3 ${
                  currentStatus === s ? 'font-bold' : ''
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${sc.bgClass}`} />
                {sc.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
