"use client";

import { InsightsResponseTime } from "../api/insights.api";

interface Props {
  data: InsightsResponseTime[];
  isLoading: boolean;
}

export function ResponseTimeStats({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full">
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
      <div className="flex flex-col h-full w-full items-center justify-center">
        <p className="text-gray-500 text-center">No cases found.</p>
      </div>
    );
  }

  // Calculate maxMins based ONLY on resolved cases
  const resolvedData = data.filter(d => d.avg_response_time_seconds !== null);
  const maxMins = resolvedData.length > 0 
    ? Math.max(...resolvedData.slice(0, 10).map(d => d.avg_response_time_seconds!)) / 60
    : 1;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="overflow-y-auto flex-1 pr-2">
        <div className="space-y-3">
          {data.slice(0, 10).map((stat) => {
            let displayTime = "Ongoing";
            let percentage = 100;
            let showOngoing = true;

            if (stat.avg_response_time_seconds !== null) {
              showOngoing = false;
              const mins = Math.floor(stat.avg_response_time_seconds / 60);
              const hrs = Math.floor(mins / 60);
              displayTime = hrs > 0
                ? `${hrs}h ${mins % 60}m`
                : mins > 0 ? `${mins}m` : `<1m`;
              
              percentage = Math.min(100, (mins / (maxMins || 1)) * 100);
            }

            return (
              <div key={stat.barangay} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-foreground truncate max-w-[60%]">{stat.barangay}</span>
                  <span className="text-gray-500 flex items-center gap-1.5">
                    {showOngoing && <span className="w-2 h-2 rounded-full bg-info animate-pulse inline-block"></span>}
                    {displayTime} ({stat.total_cases} cases)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${showOngoing ? 'bg-info/30' : 'bg-info'} h-2 rounded-full transition-all duration-500`}
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
