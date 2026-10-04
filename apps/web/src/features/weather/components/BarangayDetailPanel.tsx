import React, { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiTrendingUp,
  FiClock,
  FiEye,
  FiUsers,
  } from "react-icons/fi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import WeatherCard from "./WeatherCard";
import { BarangayWeather } from "../types/weather.types";
import { ClusterConfig } from "../data/clusters";
import {
  fetchHistoricalWeather,
  HistoricalWeatherResult,
} from "../data/weather.api";

type TabType = "overview" | "trend" | "history";

interface BarangayDetailPanelProps {
  weather: BarangayWeather;
  cluster: ClusterConfig | null;
  onClose: () => void;
}

export const BarangayDetailPanel: React.FC<BarangayDetailPanelProps> = ({
  weather,
  cluster,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [historicalWeather, setHistoricalWeather] =
    useState<HistoricalWeatherResult | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const result = await fetchHistoricalWeather(24);
        if (!cancelled) setHistoricalWeather(result);
      } catch (error) {
        if (!cancelled) {
          setHistoricalWeather(null);
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Historical weather is unavailable.",
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [weather.id]);

  const hourlyTrend = useMemo(
    () =>
      historicalWeather?.observations.map((observation) => ({
        ...observation,
        time: new Date(`${observation.timestamp}:00+08:00`).toLocaleTimeString(
          "en-PH",
          { hour: "2-digit", minute: "2-digit", hour12: false },
        ),
      })) ?? [],
    [historicalWeather],
  );

  const formatObservationTime = (timestamp: string) =>
    new Date(`${timestamp}:00+08:00`).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
          onClick={() => setActiveTab("overview")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md body-small font-medium transition-all duration-200 ${
            activeTab === "overview"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiEye className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("trend")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md body-small font-medium transition-all duration-200 ${
            activeTab === "trend"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiTrendingUp className="w-4 h-4" />
          Trend
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md body-small font-medium transition-all duration-200 ${
            activeTab === "history"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiClock className="w-4 h-4" />
          History
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
        {activeTab === "overview" && (
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
                    <span className="body-small text-gray-500">
                      Assigned Cluster
                    </span>
                    <span className="body-small font-medium text-gray-900">
                      {cluster.label}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "trend" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full flex flex-col">
            <h3 className="body-small font-semibold text-gray-900 mb-1">
              24-Hour Observed Trend
            </h3>
            <p className="body-xsmall text-gray-400 mb-4">
              {historicalWeather?.location ?? "Taguig City observation area"} ·
              Asia/Manila
            </p>
            {historyLoading && (
              <p className="body-small text-gray-500 py-8 text-center">
                Loading observed history...
              </p>
            )}
            {!historyLoading && historyError && (
              <p className="body-small text-gray-500 py-8 text-center">
                Historical weather is unavailable.
              </p>
            )}
            {!historyLoading && !historyError && hourlyTrend.length === 0 && (
              <p className="body-small text-gray-500 py-8 text-center">
                No historical observations are available.
              </p>
            )}
            {!historyLoading && !historyError && hourlyTrend.length > 0 && (
              <div className="flex-1 w-full" style={{ minHeight: "280px" }}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={hourlyTrend}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: "4px",
                      }}
                      itemStyle={{ fontSize: "12px", padding: "2px 0" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      iconType="circle"
                    />
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
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-[500px] overflow-auto">
            <h3 className="body-small font-semibold text-gray-900 mb-1">
              Observed Weather History
            </h3>
            <p className="body-xsmall text-gray-400 mb-4">
              Actual hourly records from{" "}
              {historicalWeather?.location ?? "the Taguig observation area"}.
            </p>
            {historyLoading && (
              <p className="body-small text-gray-500 py-8 text-center">
                Loading observed history...
              </p>
            )}
            {!historyLoading && historyError && (
              <p className="body-small text-gray-500 py-8 text-center">
                Historical weather is unavailable.
              </p>
            )}
            {!historyLoading &&
              !historyError &&
              historicalWeather?.observations.length === 0 && (
                <p className="body-small text-gray-500 py-8 text-center">
                  No historical observations are available.
                </p>
              )}
            {!historyLoading &&
              !historyError &&
              historicalWeather &&
              historicalWeather.observations.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="min-w-[420px] space-y-2">
                    {historicalWeather.observations
                      .slice()
                      .reverse()
                      .map((observation) => (
                        <div
                          key={observation.timestamp}
                          className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-2 border-b border-gray-100 pb-2"
                        >
                          <span className="body-xsmall text-gray-500">
                            {formatObservationTime(observation.timestamp)}
                          </span>
                          <span className="body-xsmall text-gray-700">
                            {observation.conditionLabel}
                          </span>
                          <span className="body-xsmall text-gray-700">
                            {observation.temperature}°C
                          </span>
                          <span className="body-xsmall text-gray-700">
                            {observation.rain} mm rain
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
