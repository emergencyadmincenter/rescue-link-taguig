"use client";

import { useMemo } from "react";
import { InsightsPeakTime } from "../api/insights.api";

interface Props {
  data: InsightsPeakTime[];
  isLoading: boolean;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PeakTimePatterns({ data, isLoading }: Props) {
  const maxCount = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0;
  }, [data]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-gray-100 border-gray-200";
    if (maxCount === 0) return "bg-gray-100 border-gray-200";
    
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-primary-subtle border-primary/20 text-primary";
    if (ratio < 0.5) return "bg-primary/40 border-primary/40 text-primary-foreground";
    if (ratio < 0.75) return "bg-primary/70 border-primary/70 text-primary-foreground";
    return "bg-primary border-primary text-primary-foreground";
  };

  // Create a lookup map for O(1) access
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      // Postgres ISODOW: 1=Mon, 7=Sun
      map.set(`${d.dayOfWeek}-${d.hourOfDay}`, d.count);
    });
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm h-full flex flex-col">
        <h3 className="title-medium mb-md text-foreground">Peak Time Patterns</h3>
        <div className="animate-pulse flex-1 bg-gray-100 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm flex flex-col h-full">
      <h3 className="title-medium mb-md text-foreground shrink-0">Peak Time Patterns</h3>
      
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[700px] flex">
          {/* Y Axis Labels (Days) */}
          <div className="flex flex-col gap-1 pr-3 pt-6 shrink-0">
            {DAYS.map((day) => (
              <div key={day} className="h-6 flex items-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Area */}
          <div className="flex-1 flex flex-col">
            {/* X Axis Labels (Hours) */}
            <div className="flex gap-1 mb-2 h-4">
              {HOURS.map((hour) => (
                <div key={hour} className="flex-1 flex justify-center text-[10px] text-gray-400">
                  {hour % 3 === 0 ? `${hour}h` : ""}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="flex flex-col gap-1">
              {DAYS.map((day, dayIndex) => {
                const dayNum = dayIndex + 1; // 1 to 7
                return (
                  <div key={day} className="flex gap-1">
                    {HOURS.map((hour) => {
                      const count = dataMap.get(`${dayNum}-${hour}`) || 0;
                      return (
                        <div
                          key={hour}
                          title={`${day} ${hour}:00 - ${count} incidents`}
                          className={`
                            flex-1 h-6 rounded-sm border transition-colors hover:ring-2 hover:ring-gray-300
                            flex items-center justify-center text-[10px] font-medium
                            ${getIntensityClass(count)}
                          `}
                        >
                          {count > 0 && maxCount < 50 ? count : ""}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500">
        <span>Less</span>
        <div className="w-4 h-4 rounded-sm bg-gray-100 border border-gray-200"></div>
        <div className="w-4 h-4 rounded-sm bg-primary-subtle border border-primary/20"></div>
        <div className="w-4 h-4 rounded-sm bg-primary/40 border border-primary/40"></div>
        <div className="w-4 h-4 rounded-sm bg-primary/70 border border-primary/70"></div>
        <div className="w-4 h-4 rounded-sm bg-primary border border-primary"></div>
        <span>More</span>
      </div>
    </div>
  );
}
