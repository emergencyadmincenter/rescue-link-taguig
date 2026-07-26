"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import {
  FiUsers,
  FiAlertTriangle,
  FiActivity,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiMapPin,
  FiTruck,
  FiMessageSquare,
} from "react-icons/fi";
import { MetricCard } from "./metric-card";
import { logsApi } from "@/features/logs/api/logs.api";
import { StatusCounts, Log, Resource } from "@/features/logs/types/logs.types";

export function DashboardPageView() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("admin");

  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [assignedLogs, setAssignedLogs] = useState<Log[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [counts, allRecent, assigned, allResources] = await Promise.all([
          logsApi.getStatusCounts(),
          logsApi.getLogs({
            limit: 10,
            sort_by: "created_at",
            sort_order: "desc",
          }),
          user
            ? logsApi.getLogs({
                assigned_coordinator_id: user.id,
                status: "active",
                limit: 5,
              })
            : Promise.resolve({ data: [] }),
          logsApi.getResources(),
        ]);

        setStatusCounts(counts);
        setRecentLogs(allRecent.data || []);
        setAssignedLogs(assigned.data || []);
        setResources(allResources || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading || !statusCounts) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-xl max-w-[1600px] mx-auto pb-2xl px-4 sm:px-6 lg:px-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-12 pb-8 mb-8 border-b border-gray-100 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/3"></div>
        <div className="relative z-10 flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl text-gray-900 tracking-tight font-bold font-outfit">
            {isAdmin ? "Taguig Command Center Overview" : "Operational Readiness"}
          </h1>
          <div className="divider-primary-half" />
          <p className="text-lg text-gray-500">
            {isAdmin
              ? "System-wide insights into Taguig active emergencies, resource availability, and operational statistics."
              : "Your current assignments, active emergencies in Taguig City, and rapid response actions."}
          </p>
        </div>

        {/* Quick Actions Contextual to Role */}
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          {isAdmin ? (
            <Link
              href="/personnel"
              className="flex-1 md:flex-none px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FiUsers className="w-5 h-5" /> Manage Personnel
            </Link>
          ) : (
            <Link
              href="/weather"
              className="flex-1 md:flex-none px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FiAlertTriangle className="w-5 h-5" /> View Weather Alerts
            </Link>
          )}
          <Link
            href="/logs"
            className="flex-1 md:flex-none px-5 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <FiActivity className="w-5 h-5" /> Emergency Logs
          </Link>
        </div>
      </div>

      {/* Role-Based Dashboard Content */}
      {isAdmin ? (
        <AdminDashboard
          statusCounts={statusCounts}
          recentLogs={recentLogs}
          resources={resources}
        />
      ) : (
        <CoordinatorDashboard
          statusCounts={statusCounts}
          assignedLogs={assignedLogs}
          recentLogs={recentLogs}
        />
      )}
    </div>
  );
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// --- Administrator Dashboard Component ---
function AdminDashboard({
  statusCounts,
  recentLogs,
  resources,
}: {
  statusCounts: StatusCounts;
  recentLogs: Log[];
  resources: Resource[];
}) {
  const activeEmergencies = recentLogs.filter(
    (log) => log.status === "active" || log.status === "dispatched",
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <MetricCard
          title="Active & Dispatched"
          value={statusCounts.active + statusCounts.dispatched}
          icon={<FiAlertTriangle className="w-6 h-6" />}
          href="/logs?status=active"
          className="border-danger/15 hover:border-danger/40 bg-gradient-to-br from-white to-danger/[0.02]"
        />
        <MetricCard
          title="Resolved Today"
          value={statusCounts.resolved}
          icon={<FiCheckCircle className="w-6 h-6" />}
          href="/logs?status=resolved"
          className="hover:border-success/30"
        />
        <MetricCard
          title="Total System Logs"
          value={statusCounts.total}
          icon={<FiActivity className="w-6 h-6" />}
          href="/logs"
          className="hover:border-primary/30"
        />
        <MetricCard
          title="Taguig System Resources"
          value={resources.length}
          icon={<FiTruck className="w-6 h-6" />}
          href="/personnel"
          className="border-warning/20 hover:border-warning/50 bg-gradient-to-br from-white to-warning/[0.02]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-8 relative z-10">
        {/* Left Column: Recent Active Incidents */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-outfit mb-1">
                  Ongoing Emergencies
                </h3>
                <p className="text-sm text-gray-500">
                  Currently active or dispatched incidents requiring attention
                </p>
              </div>
              <Link
                href="/logs?status=active"
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                View All Active
              </Link>
            </div>

            {activeEmergencies.length > 0 ? (
              <div className="space-y-4">
                {activeEmergencies.slice(0, 5).map((log) => (
                  <Link key={log.id} href={`/logs/${log.id}`} className="block">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${log.status === "active" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}
                        >
                          <FiAlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {log.reference_no}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                            <FiMapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px] sm:max-w-[300px]">
                              {log.address || "Location unavailable"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg ${log.status === "active" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}
                        >
                          {log.status}
                        </span>
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <FiClock className="w-3 h-3" />{" "}
                          {timeAgo(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <FiCheckCircle className="w-12 h-12 text-success/50 mb-3" />
                <p className="font-medium text-gray-900">
                  No active emergencies in Taguig
                </p>
                <p className="text-sm text-gray-500">
                  All reported incidents across barangays are currently resolved.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: System Resources & Recent Activity */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 font-outfit mb-1">
                Recent Activity
              </h3>
              <p className="text-sm text-gray-500">Latest system logs</p>
            </div>

            {recentLogs.length > 0 ? (
              <div className="space-y-4">
                {recentLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                      <div className="w-px h-full bg-gray-100 my-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        Emergency {log.status}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {log.reference_no} • {timeAgo(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity found.
              </p>
            )}

            <Link
              href="/logs"
              className="block w-full mt-2 py-3 text-center text-sm font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors"
            >
              View All Logs
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Coordinator Dashboard Component ---
function CoordinatorDashboard({
  statusCounts,
  assignedLogs,
  recentLogs,
}: {
  statusCounts: StatusCounts;
  assignedLogs: Log[];
  recentLogs: Log[];
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <MetricCard
          title="My Active Assignments"
          value={assignedLogs.length}
          icon={<FiShield className="w-6 h-6" />}
          href="/logs?assigned=me&status=active"
          className="border-primary/15 hover:border-primary/40 bg-gradient-to-br from-white to-primary/[0.02]"
        />
        <MetricCard
          title="My Handled Emergencies"
          value={statusCounts.my_logs}
          icon={<FiCheckCircle className="w-6 h-6" />}
          href="/logs?assigned=me"
          className="hover:border-primary/30"
        />
        <MetricCard
          title="System-wide Active"
          value={statusCounts.active}
          icon={<FiAlertTriangle className="w-6 h-6" />}
          href="/logs?status=active"
          className="hover:border-danger/30"
        />
        <MetricCard
          title="Total System Logs"
          value={statusCounts.total}
          icon={<FiActivity className="w-6 h-6" />}
          href="/logs"
          className="hover:border-primary/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-8 relative z-10">
        {/* Left Column: My Assigned Incidents */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 lg:h-[500px] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-outfit mb-1">
                  My Active Assignments
                </h3>
                <p className="text-sm text-gray-500">
                  Emergencies currently assigned to your coordination
                </p>
              </div>
            </div>

            {assignedLogs.length > 0 ? (
              <div className="space-y-4">
                {assignedLogs.map((log) => (
                  <Link key={log.id} href={`/logs/${log.id}`} className="block">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all group cursor-pointer shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                          <FiShield className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {log.reference_no}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-0.5 font-medium">
                            <FiMapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px] sm:max-w-[300px]">
                              {log.address || "Location unavailable"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 text-xs font-bold uppercase rounded-lg bg-white border border-primary/20 text-primary shadow-sm">
                          Manage Session
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                  <FiCheckCircle className="w-8 h-8 text-success/60" />
                </div>
                <p className="font-medium text-gray-900 text-lg">
                  No active assignments
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You are currently clear. Stand by for incoming requests.
                </p>
              </div>
            )}
          </div>

          {/* Quick access to global recent logs */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-outfit mb-1">
                  Global System Logs
                </h3>
                <p className="text-sm text-gray-500">
                  Recent logs from all coordinators
                </p>
              </div>
              <Link
                href="/logs"
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentLogs.slice(0, 4).map((log) => (
                <Link
                  key={log.id}
                  href={`/logs/${log.id}`}
                  className="flex flex-col p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-gray-900">
                      {log.reference_no}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${log.status === "active" ? "bg-danger/10 text-danger" : log.status === "resolved" ? "bg-success/10 text-success" : "bg-gray-100 text-gray-600"}`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 line-clamp-1">
                    {log.address || log.description || "No details provided"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Briefing */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 font-outfit mb-6">
              Coordinator Briefing
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex gap-4 p-5 rounded-2xl bg-info/5 border border-info/15">
                <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                  <FiUsers className="w-6 h-6 text-info" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Shift Status: Active
                  </h4>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                    You are currently logged in and visible to the system as
                    available for incoming emergency requests.
                  </p>
                </div>
              </div>

              <Link
                href="/weather"
                className="flex gap-4 p-5 rounded-2xl bg-warning/5 border border-warning/15 hover:bg-warning/10 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <FiAlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-warning-hover transition-colors">
                    Weather Monitoring
                  </h4>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                    Check the current weather conditions and proactive hazard
                    warnings to better anticipate incidents.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
