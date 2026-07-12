"use client";

import { Log } from "../types/logs.types";
import LogCard from "./LogCard";
import { FiInbox } from "react-icons/fi";

interface LogListProps {
  logs: Log[];
  loading: boolean;
  activeLogId?: string;
  onLogClick: (id: string) => void;
}

function LogSkeleton() {
  return (
    <div className="py-4 px-2 border-b border-gray-100 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-12 bg-gray-100 rounded" />
      </div>
      <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-100 rounded mb-4" />
      <div className="flex justify-between mt-3">
        <div className="h-3 w-36 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function LogList({
  logs,
  loading,
  activeLogId,
  onLogClick,
}: LogListProps) {
  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col overflow-hidden h-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <LogSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-gray-400">
        <FiInbox className="w-12 h-12 mb-4 opacity-30" />
        <p className="body-medium font-medium text-gray-500">No logs found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {logs.map((log) => (
        <LogCard
          key={log.id}
          log={log}
          onClick={onLogClick}
          isActive={activeLogId === log.id}
        />
      ))}
    </div>
  );
}
