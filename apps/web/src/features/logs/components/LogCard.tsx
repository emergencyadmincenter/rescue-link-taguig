"use client";

import { Log } from "../types/logs.types";
import StatusBadge from "./StatusBadge";
import { SOURCE_CONFIG } from "../constants/logs.constants";

interface LogCardProps {
  log: Log;
  onClick: (id: string) => void;
  isActive?: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function LogCard({ log, onClick, isActive }: LogCardProps) {
  return (
    <button
      onClick={() => onClick(log.id)}
      className={`w-full text-left py-4 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isActive ? "bg-gray-50" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <StatusBadge status={log.status} />
        <span className="body-xsmall text-gray-400">
          {formatTimeAgo(log.created_at)}
        </span>
      </div>

      <h3 className="body-medium font-bold text-gray-900 mb-1 truncate group-hover:text-primary transition-colors">
        {log.caller_name || "Unknown Caller"}
      </h3>

      {log.description && (
        <p className="body-small text-gray-500 truncate mb-2">
          {log.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="body-xsmall text-gray-400 truncate">
          Coordinator: {log.assigned_coordinator?.name || "Unassigned"}
        </span>
        <span className="body-xsmall font-medium text-gray-500 shrink-0 ml-4">
          ID: {log.reference_no}
        </span>
      </div>
    </button>
  );
}
