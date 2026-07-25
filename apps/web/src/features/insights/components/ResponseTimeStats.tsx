"use client";

import { InsightsResponseTime } from "../api/insights.api";

interface Props {
  data: InsightsResponseTime[];
  isLoading: boolean;
}

export function ResponseTimeStats({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm">
        <h3 className="title-medium mb-md text-foreground">Response Time Analytics</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm">
        <h3 className="title-medium mb-md text-foreground">Response Time Analytics</h3>
        <p className="text-gray-500 text-center py-xl">No resolved incidents found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm overflow-hidden flex flex-col h-full">
      <h3 className="title-medium mb-md text-foreground shrink-0">Avg Resolution Time (Top 10)</h3>
      <div className="overflow-y-auto flex-1 pr-2">
        <div className="space-y-3">
          {data.slice(0, 10).map((stat) => {
            const mins = Math.floor(stat.avg_response_time_seconds / 60);
            const hrs = Math.floor(mins / 60);
            const displayTime = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;

            // Simple visual bar
            const maxMins = Math.max(...data.slice(0, 10).map(d => d.avg_response_time_seconds)) / 60;
            const percentage = Math.min(100, (mins / (maxMins || 1)) * 100);

            return (
              <div key={stat.barangay} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-foreground truncate max-w-[60%]">{stat.barangay}</span>
                  <span className="text-gray-500">{displayTime} ({stat.total_resolved} cases)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-info h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
