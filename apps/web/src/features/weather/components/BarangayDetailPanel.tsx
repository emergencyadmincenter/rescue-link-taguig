import React, { useState, useMemo } from 'react';
import { FiX, FiTrendingUp, FiClock, FiEye, FiUsers, FiMapPin } from 'react-icons/fi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import WeatherCard from './WeatherCard';
import { BarangayWeather } from '../types/weather.types';
import { ClusterConfig } from '../data/clusters';
import { generateHourlyTrend, generateHistoryLog, type HistoryEntry } from '../data/weather-detail.mock';

type TabType = 'overview' | 'trend' | 'history';

interface BarangayDetailPanelProps {
  weather: BarangayWeather;
  cluster: ClusterConfig | null;
  onClose: () => void;
}

export const BarangayDetailPanel: React.FC<BarangayDetailPanelProps> = ({ weather, cluster, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const hourlyTrend = useMemo(() => {
    return generateHourlyTrend(weather);
  }, [weather]);

  const historyLog = useMemo(() => {
    return generateHistoryLog(weather);
  }, [weather]);

  return (
    <div className="flex flex-col min-h-0 animate-fade-in h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="body-xsmall text-gray-500 font-medium uppercase tracking-wide">
          Barangay Details
        </span>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          aria-label="Close"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4 inline-flex p-1 bg-gray-100 rounded-lg w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md body-small font-medium transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiEye className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('trend')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md body-small font-medium transition-all duration-200 ${
            activeTab === 'trend'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiTrendingUp className="w-4 h-4" />
          Trend
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md body-small font-medium transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiClock className="w-4 h-4" />
          History
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <WeatherCard weather={weather} />
            {cluster && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiUsers className="w-4 h-4 text-primary" />
                  <span className="body-small font-semibold text-gray-900">
                    Cluster Information
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="body-small text-gray-500">Assigned Cluster</span>
                    <span className="body-small font-medium text-gray-900">{cluster.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="body-small text-gray-500">Assigned Team</span>
                    <span className="body-small font-medium text-gray-900">{cluster.assignedTeam}</span>
                  </div>
                  {cluster.commandPost && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                      <span className="body-small text-gray-500 flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        Command Post
                      </span>
                      <span className="body-small font-medium text-gray-900 text-right max-w-[150px] truncate">
                        {cluster.commandPost}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full flex flex-col">
            <h3 className="body-small font-semibold text-gray-900 mb-4">24-Hour Forecast Trend</h3>
            {/* 
              // TODO: BACKEND - The trend chart currently displays synthetic data extrapolated from a single weather snapshot. A real implementation requires a time-series weather endpoint (e.g. GET /api/weather/:barangayId/hourly) that returns actual historical hourly readings.
            */}
            <div className="flex-1 w-full" style={{ minHeight: '280px' }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hourlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}
                    itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="temperature" 
                    name="Temp (°C)" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="precipitation" 
                    name="Rain (mm)" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="body-small font-semibold text-gray-900 mb-4">Status History</h3>
            {/* 
              // TODO: BACKEND - The history log currently shows synthetic events generated from static data. A real implementation requires a backend event log service (e.g. GET /api/weather/:barangayId/events) that records and serves actual status transitions, alert changes, and threshold crossings as they occur.
            */}
            <div className="relative pl-3 border-l-2 border-gray-100 space-y-6">
              {historyLog.map((event: any, index: number) => {
                const getDotColor = (type: string) => {
                  switch (type) {
                    case 'upgrade': return 'bg-danger border-danger-subtle';
                    case 'downgrade': return 'bg-success border-success-subtle';
                    case 'info': default: return 'bg-gray-400 border-gray-200';
                  }
                };

                return (
                  <div key={index} className="relative">
                    <div className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full border-2 ${getDotColor(event.type)}`} />
                    <div className="flex flex-col gap-1">
                      <span className="body-xsmall text-gray-500 font-medium">{event.displayTime}</span>
                      <p className="body-small text-gray-700">{event.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
