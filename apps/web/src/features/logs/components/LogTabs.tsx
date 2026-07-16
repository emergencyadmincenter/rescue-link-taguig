'use client';

import { LogStatus, StatusCounts } from '../types/logs.types';
import { LOG_TABS } from '../constants/logs.constants';

interface LogTabsProps {
  activeTab: LogStatus | 'all' | 'my_logs';
  onTabChange: (tab: string) => void;
  counts: StatusCounts;
}

export default function LogTabs({ activeTab, onTabChange, counts }: LogTabsProps) {
  const getCount = (value: string) => {
    if (value === 'all') return counts.total;
    if (value === 'my_logs') return null;
    return counts[value as LogStatus] ?? 0;
  };

  return (
    <div className="inline-flex p-1 bg-gray-100 rounded-lg">
      {LOG_TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        const count = getCount(tab.value);
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            {tab.label}
            {count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
