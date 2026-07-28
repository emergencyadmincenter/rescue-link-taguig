"use client";

import { Log } from "../types/logs.types";
import StatusBadge from "./StatusBadge";
import StatusSelector from "./StatusSelector";
import { SOURCE_CONFIG } from "../constants/logs.constants";
import { LogStatus } from "../types/logs.types";

interface LogCardProps {
  log: Log;
  onClick: (id: string) => void;
  onStatusChange?: (id: string, status: LogStatus) => void;
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

export default function LogCard({
  log,
  onClick,
  onStatusChange,
  isActive,
}: LogCardProps) {
  return (
    <div
      onClick={() => onClick(log.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick(log.id);
      }}
      className={`w-full text-left py-4 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
        isActive ? "bg-gray-50" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={log.status} />
          {log.is_shadow_banned && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger/10 text-danger border border-danger/20"
              title="This request is associated with a shadow-banned resident"
            >
              Shadow Banned
            </span>
          )}
        </div>
        <span className="body-xsmall text-gray-400 shrink-0 ml-2 pt-0.5">
          {formatTimeAgo(log.created_at)}
        </span>
      </div>

      <h3 className="body-medium font-bold text-gray-900 truncate transition-colors mb-1">
        {log.caller_name || "Unknown Caller"}
      </h3>

      {log.description && (
        <p className="body-small text-gray-500 truncate mb-3">
          {log.description}
        </p>
      )}

      <div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-100/50">
        <div className="flex flex-col gap-0.5 min-w-0 pr-3">
          <span className="body-xsmall text-gray-400 truncate">
            Coord: {log.assigned_coordinator?.name || "Unassigned"}
          </span>
        </div>

        <div className="shrink-0 flex items-center">
          <span className="text-[10px] font-mono text-gray-500 font-medium px-1.5 py-0.5 rounded-md bg-gray-100/80 border border-gray-200/50">
            {log.reference_no}
          </span>
        </div>
      </div>
    </div>
  );
}
