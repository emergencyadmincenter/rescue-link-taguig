import { LogStatus, LogSource, CallStatus } from '../types/logs.types';

export const STATUS_CONFIG: Record<LogStatus, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  active: {
    label: 'Active',
    bgClass: 'bg-danger',
    textClass: 'text-danger',
    borderClass: 'border-danger',
  },
  dispatched: {
    label: 'Dispatched',
    bgClass: 'bg-warning',
    textClass: 'text-warning',
    borderClass: 'border-warning',
  },
  resolved: {
    label: 'Resolved',
    bgClass: 'bg-success',
    textClass: 'text-success',
    borderClass: 'border-success',
  },
  cancelled: {
    label: 'Cancelled',
    bgClass: 'bg-foreground/50',
    textClass: 'text-foreground/50',
    borderClass: 'border-foreground/40',
  },
};

export const SOURCE_CONFIG: Record<LogSource, { label: string; icon: string }> = {
  manual: { label: 'Manual Entry', icon: 'FiEdit3' },
  voice_call: { label: 'Voice Call', icon: 'FiPhone' },
  chat: { label: 'In-app Chat', icon: 'FiMessageSquare' },
};

export const CALL_STATUS_CONFIG: Record<CallStatus, { label: string; colorClass: string }> = {
  ringing: { label: 'Ringing', colorClass: 'text-warning' },
  active: { label: 'Active Call', colorClass: 'text-success' },
  ended: { label: 'Call Ended', colorClass: 'text-danger' },
  missed: { label: 'Call Missed', colorClass: 'text-danger' },
  rejected: { label: 'Call Rejected', colorClass: 'text-foreground/50' },
};

export const LOG_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'My Logs', value: 'my_logs' as const },
  { label: 'Active', value: 'active' as LogStatus },
  { label: 'Dispatched', value: 'dispatched' as LogStatus },
  { label: 'Resolved', value: 'resolved' as LogStatus },
  { label: 'Cancelled', value: 'cancelled' as LogStatus },
];

export const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Custom Range', value: 'custom' },
];
