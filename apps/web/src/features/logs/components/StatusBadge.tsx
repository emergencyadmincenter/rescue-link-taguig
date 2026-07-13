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
      className={`inline-flex items-center font-semibold rounded-full text-white capitalize ${
        config.bgClass
      } ${size === 'sm' ? 'px-3 py-0.5 text-xs' : 'px-4 py-1 text-sm'}`}
    >
      {config.label}
    </span>
  );
}
