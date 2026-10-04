'use client';

import { LogStatus } from '../types/logs.types';
import { STATUS_CONFIG } from '../constants/logs.constants';

interface StatusBadgeProps {
  status: LogStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full text-white capitalize ${
        config.bgClass
      } ${size === 'sm' ? 'px-3 py-0.5 text-xs' : 'px-4 py-1 text-sm'}`}
    >
      <span
        className={`shrink-0 rounded-full bg-white/30 ${
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
        }`}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

