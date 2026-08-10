"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import dynamic from "next/dynamic";
import {
  insightsApi,
  InsightsIncident,
  InsightsResponseTime,
  InsightsWorkload,
  InsightsPeakTime,
  IncidentCategory,
} from "../api/insights.api";
import { InsightsFilterBar } from "./InsightsFilterBar";
import { ResponseTimeStats } from "./ResponseTimeStats";
import { WorkloadPanel } from "./WorkloadPanel";
import { PeakTimePatterns } from "./PeakTimePatterns";
import { useSocket } from "@/lib/socket";
import {
  FiEye as Eye,
  FiEyeOff as EyeOff,
  FiBell as Bell,
  FiMaximize2 as Maximize,
  FiMinimize2 as Minimize,
  FiAlertTriangle,
} from "react-icons/fi";

class PanelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Insights Panel Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-[300px]">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-3">
            <FiAlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <h3 className="title-small text-gray-900 mb-1">Panel Error</h3>
          <p className="body-xsmall text-gray-500 mb-4">
            An unexpected error occurred while rendering this component.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md body-small font-medium hover:bg-primary-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const IncidentMapView = dynamic(
  () => import("./IncidentMapView").then((mod) => mod.IncidentMapView),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-lg h-full min-h-[400px]"></div>
    ),
  },
);

type PanelConfig = {
  id: string;
  title: string;
  content: React.ReactNode;
  colSpan?: string;
};

export function InsightsDashboard() {
  const [incidents, setIncidents] = useState<InsightsIncident[]>([]);
  const [responseTimes, setResponseTimes] = useState<InsightsResponseTime[]>(
    [],
  );
  const [workload, setWorkload] = useState<InsightsWorkload[]>([]);
  const [peakTimes, setPeakTimes] = useState<InsightsPeakTime[]>([]);
  const [categories, setCategories] = useState<IncidentCategory[]>([]);

  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingAggregates, setLoadingAggregates] = useState(true);

  // UI State
  const [hiddenPanels, setHiddenPanels] = useState<Set<string>>(new Set());
  const [unreadNotifications, setUnreadNotifications] = useState<Set<string>>(
    new Set(),
  );
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    barangay: "",
    incidentCategoryId: "",
  });

  const { socket } = useSocket();

  const playAlertSound = useCallback(() => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.5,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }, []);

  type FilterState = typeof filters;

  const fetchAggregates = useCallback(async (f: FilterState) => {
    setLoadingAggregates(true);
    try {
      const params = {
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
        barangay: f.barangay || undefined,
        incidentCategoryId: f.incidentCategoryId || undefined,
      };
      const [rtData, wlData, ptData, catData] = await Promise.all([
        insightsApi.getResponseTimes(params),
        insightsApi.getWorkload(params),
        insightsApi.getPeakTimes(params),
        insightsApi.getIncidentCategories(),
      ]);
      setResponseTimes(rtData);
      setWorkload(wlData);
      setPeakTimes(ptData);
      setCategories(catData);
    } catch (error) {
      console.error("Failed to load aggregate insights:", error);
    } finally {
      setLoadingAggregates(false);
    }
  }, []);

  const fetchIncidents = useCallback(async (f: FilterState) => {
    setLoadingIncidents(true);
    try {
      const data = await insightsApi.getIncidents({
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
        barangay: f.barangay || undefined,
        incidentCategoryId: f.incidentCategoryId || undefined,
      });
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents for map:", error);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  const fetchAll = useCallback(
    (f: FilterState) => {
      fetchIncidents(f);
      fetchAggregates(f);
    },
    [fetchIncidents, fetchAggregates],
  );

  // Socket: real-time new incident
  useEffect(() => {
    if (!socket) return;
    const handleNewIncident = () => {
      // Use the latest filters via functional ref to avoid stale closure
      setFilters((currentFilters) => {
        fetchAll(currentFilters);
        return currentFilters;
      });
      playAlertSound();

      setHiddenPanels((currentHidden) => {
        if (currentHidden.size > 0) {
          setUnreadNotifications((prev) => {
            const next = new Set(prev);
            currentHidden.forEach((panelId) => next.add(panelId));
            return next;
          });
        }
        return currentHidden;
      });
    };
    socket.on("new_incident", handleNewIncident);
    return () => {
      socket.off("new_incident", handleNewIncident);
    };
  }, [socket, playAlertSound, fetchAll]);

  // Fetch everything whenever filters change (and on mount)
  useEffect(() => {
    fetchAll(filters);
  }, [filters]);

  const togglePanel = (panelId: string) => {
    if (maximizedPanel && panelId !== maximizedPanel) {
      setMaximizedPanel(null);
      setHiddenPanels((prev) => {
        const next = new Set(prev);
        next.delete(panelId);
        return next;
      });
      setUnreadNotifications((notifs) => {
        const newNotifs = new Set(notifs);
        newNotifs.delete(panelId);
        return newNotifs;
      });
      return;
    }

    setHiddenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
        setUnreadNotifications((notifs) => {
          const newNotifs = new Set(notifs);
          newNotifs.delete(panelId);
          return newNotifs;
        });
      } else {
        next.add(panelId);
        if (maximizedPanel === panelId) setMaximizedPanel(null);
      }
      return next;
    });
  };

  const panels: PanelConfig[] = [
    {
      id: "map",
      title: "Incident Map",
      colSpan: "xl:col-span-2",
      content: (
        <IncidentMapView
          incidents={incidents}
          isLoading={loadingIncidents}
          selectedBarangay={filters.barangay}
        />
      ),
    },
    {
      id: "responseTimes",
      title: "Response Times",
      colSpan: "xl:col-span-1",
      content: (
        <ResponseTimeStats data={responseTimes} isLoading={loadingAggregates} />
      ),
    },
    {
      id: "peakTimes",
      title: "Peak Time Patterns",
      colSpan: "xl:col-span-1",
      content: (
        <PeakTimePatterns data={peakTimes} isLoading={loadingAggregates} />
      ),
    },
    {
      id: "workload",
      title: "Coordinator Workload",
      colSpan: "xl:col-span-2 2xl:col-span-1",
      content: <WorkloadPanel data={workload} isLoading={loadingAggregates} />,
    },
  ];

  const activePanels = panels.filter((p) => {
    if (maximizedPanel) return p.id === maximizedPanel;
    return !hiddenPanels.has(p.id);
  });

  const collapsedPanels = panels.filter((p) => {
    if (maximizedPanel) return p.id !== maximizedPanel;
    return hiddenPanels.has(p.id);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden gap-5">
      <div className="flex flex-col shrink-0">
        <div className="w-max">
          <h1 className="display-small text-foreground">
            Operational Insights
          </h1>
          <div className="divider-primary-half" />
        </div>
        <p className="body-medium text-gray-500 mt-1">
          Data-driven intelligence for emergency response planning.
        </p>
      </div>

      <InsightsFilterBar
        filters={filters}
        categories={categories}
        onFilterChange={setFilters}
        isLoading={loadingIncidents}
      />

      <div className="flex flex-1 gap-5 min-h-0 overflow-hidden">
        {/* Center Arena */}
        <div className="flex-1 overflow-y-auto pr-2 pb-5">
          {maximizedPanel ? (
            <div className="h-full w-full bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white z-10">
                <h3 className="title-medium text-foreground m-0">
                  {panels.find((p) => p.id === maximizedPanel)?.title}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMaximizedPanel(null)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-subtle rounded-md transition-colors"
                    title="Minimize Panel"
                  >
                    <Minimize size={18} />
                  </button>
                  <button
                    onClick={() => togglePanel(maximizedPanel)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title="Hide Panel"
                  >
                    <EyeOff size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 w-full relative overflow-hidden">
                <PanelErrorBoundary>
                  {panels.find((p) => p.id === maximizedPanel)?.content}
                </PanelErrorBoundary>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 auto-rows-[minmax(400px,auto)]">
              {activePanels.map((panel) => (
                <div
                  key={panel.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${panel.colSpan}`}
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white z-10">
                    <h3 className="title-medium text-foreground m-0">
                      {panel.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMaximizedPanel(panel.id)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-subtle rounded-md transition-colors"
                        title="Maximize Panel"
                      >
                        <Maximize size={18} />
                      </button>
                      <button
                        onClick={() => togglePanel(panel.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        title="Hide Panel"
                      >
                        <EyeOff size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-hidden relative">
                    <PanelErrorBoundary>{panel.content}</PanelErrorBoundary>
                  </div>
                </div>
              ))}
              {activePanels.length === 0 && (
                <div className="col-span-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <EyeOff size={32} className="mb-2" />
                  <p>All panels are currently hidden.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Collapsed Dock */}
        {collapsedPanels.length > 0 && (
          <div className="w-16 md:w-64 shrink-0 bg-white border border-gray-100 rounded-lg p-2 md:p-4 flex flex-col gap-3 overflow-y-auto shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 hidden md:block px-1">
              Collapsed Dock
            </h4>

            {collapsedPanels.map((panel) => {
              const hasUnread = unreadNotifications.has(panel.id);
              return (
                <button
                  key={panel.id}
                  onClick={() => togglePanel(panel.id)}
                  className={`flex items-center justify-center md:justify-between p-3 rounded-lg border transition-all duration-200 group relative
                    ${hasUnread ? "bg-danger/5 border-danger/20 hover:bg-danger/10" : "bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-300 hover:shadow-sm"}`}
                  title={`Restore ${panel.title}`}
                >
                  <span className="hidden md:block text-sm font-medium text-gray-700 group-hover:text-foreground truncate pr-2">
                    {panel.title}
                  </span>

                  <div className="relative">
                    <Eye
                      size={18}
                      className={`${hasUnread ? "text-danger" : "text-gray-400 group-hover:text-primary"}`}
                    />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger"></span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
