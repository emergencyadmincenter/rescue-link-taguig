"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { InsightsWorkload } from "../api/insights.api";
import { CHART_COLORS } from "../utils/chart-colors";

interface Props {
  data: InsightsWorkload[];
  isLoading: boolean;
}

export function WorkloadPanel({ data, isLoading }: Props) {
  const chartData = useMemo(() => {
    // Recharts draws bottom up for horizontal charts by default, so we reverse it or rely on layout="vertical" ordering
    // We want the highest at the top, so we keep the sorted order.
    return data.map(d => ({
      name: d.coordinator_name,
      cases: d.handled_cases,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm h-full">
        <h3 className="title-medium mb-md text-foreground">Personnel Workload</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm h-full">
        <h3 className="title-medium mb-md text-foreground">Personnel Workload</h3>
        <p className="text-gray-500 text-center py-xl">No workload data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-lg shadow-sm flex flex-col h-full overflow-hidden">
      <h3 className="title-medium mb-md text-foreground shrink-0">Coordinator Workload</h3>
      
      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 overflow-y-auto pr-2">
        {/* Compact Table */}
        <div className="flex-1 min-w-[200px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-sm font-medium text-gray-500">Coordinator</th>
                <th className="py-2 text-sm font-medium text-gray-500 text-right">Cases</th>
              </tr>
            </thead>
            <tbody>
              {data.map((workload) => (
                <tr key={workload.coordinator_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 text-sm font-medium text-foreground truncate max-w-[120px]">
                    {workload.coordinator_name}
                  </td>
                  <td className="py-2.5 text-sm font-bold text-primary text-right">
                    {workload.handled_cases}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="flex-1 min-w-[200px] h-[250px] xl:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_COLORS.grid} />
              <XAxis type="number" tick={{ fontSize: 12, fill: CHART_COLORS.axisText }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12, fill: CHART_COLORS.axisText }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: CHART_COLORS.backgroundSubtle }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="cases" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS.primary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
