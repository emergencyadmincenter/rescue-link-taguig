"use client";

import { useAuth } from "@/providers/AuthProvider";
import { FiUsers, FiAlertTriangle, FiActivity, FiShield } from "react-icons/fi";
import { MetricCard } from "./metric-card";
import { ActiveEmergenciesWidget, EmergencyLog } from "./active-emergencies-widget";
import { ResourceStatusWidget, ResourceSummary } from "./resource-status-widget";

// Mock data for the UI demonstration
const mockEmergencies: EmergencyLog[] = [
  { id: "LOG-001", status: "active", source: "voice_call", address: "123 C6 Road, Taguig", timestamp: "Just now", assignedCoordinator: "John Doe" },
  { id: "LOG-002", status: "dispatched", source: "chat", address: "BGC High Street", timestamp: "5m ago", assignedCoordinator: "Jane Smith" },
  { id: "LOG-003", status: "active", source: "manual", address: "Market! Market! Terminal", timestamp: "12m ago" },
];

const mockResources: ResourceSummary[] = [
  { category: "responder", available: 8, total: 12 },
  { category: "medical", available: 3, total: 5 },
  { category: "relief", available: 150, total: 500 },
  { category: "utility", available: 4, total: 6 },
];

export function DashboardPageView() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("admin");

  return (
    <div className="space-y-xl max-w-7xl mx-auto pb-2xl">
      <div className="flex flex-col gap-xs pt-md">
        <h1 className="display-small text-foreground tracking-tight">
          System Overview
        </h1>
        <p className="body-medium text-gray-500">
          Here is your system overview for Taguig City.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <MetricCard
          title="Active Emergencies"
          value="3"
          icon={<FiAlertTriangle className="w-5 h-5" />}
          trend="up"
          trendValue="+1 since last hour"
          href="/logs?status=active"
          className="border-danger/10 hover:border-danger/30"
        />
        <MetricCard
          title="Active Responders"
          value="42"
          icon={<FiActivity className="w-5 h-5" />}
          trend="neutral"
          trendValue="Stable"
          href="/personnel?role=responder"
        />
        {isAdmin ? (
          <>
            <MetricCard
              title="Pending Activations"
              value="5"
              icon={<FiShield className="w-5 h-5" />}
              trend="up"
              trendValue="Requires attention"
              href="/personnel?status=pending"
              className="border-warning/20 hover:border-warning/40"
            />
            <MetricCard
              title="Total System Users"
              value="128"
              icon={<FiUsers className="w-5 h-5" />}
              href="/personnel"
            />
          </>
        ) : (
          <>
            <MetricCard
              title="My Assigned Logs"
              value="2"
              icon={<FiShield className="w-5 h-5" />}
              href="/logs?assigned=me"
            />
            <MetricCard
              title="Completed Logs"
              value="14"
              icon={<FiUsers className="w-5 h-5" />}
              trend="up"
              trendValue="Today"
            />
          </>
        )}
      </div>

      {/* Main Widgets Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
        <div className="lg:col-span-2">
          <ActiveEmergenciesWidget logs={mockEmergencies} className="h-full" />
        </div>
        <div className="lg:col-span-1">
          <ResourceStatusWidget resources={mockResources} className="h-full" />
        </div>
      </div>
    </div>
  );
}
