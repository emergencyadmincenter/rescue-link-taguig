"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogToolbar from "./LogToolbar";
import LogTabs from "./LogTabs";
import LogList from "./LogList";
import FilterDialog from "./FilterDialog";
import DateRangeDialog from "./DateRangeDialog";
import ManualLogDialog from "./ManualLogDialog";
import { useLogs } from "../hooks/useLogs";
import { logsApi } from "../api/logs.api";
import { LogStatus, Resource } from "../types/logs.types";

export default function LogsPageView() {
  const router = useRouter();
  const { logs, loading, params, updateParams, statusCounts, refresh } =
    useLogs();

  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState(params.search || "");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    logsApi
      .getResources()
      .then(setResources)
      .catch(() => {});
  }, []);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        updateParams({ search: value });
      }, 500);
    },
    [updateParams],
  );

  const handleTabChange = (tab: LogStatus | "all") => {
    updateParams({ status: tab === "all" ? undefined : tab });
  };

  return (
    <div className="bg-white h-full rounded-xl w-full px-5 py-6 flex flex-col">
      {/* Header */}
      <div className="mb-4 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="w-max">
            <h1 className="display-small text-gray-900 inline-block">
              Emergency Logs
            </h1>
            <div className="divider-primary-half" />
          </div>
        </div>
        <p className="body-small text-gray-500">
          Monitor, track, and manage all incoming emergency requests and
          dispatches in real-time.
        </p>
      </div>

      {/* Toolbar & Filters */}
      <div className="space-y-4 shrink-0 mb-4">
        <LogToolbar
          search={searchQuery}
          onSearchChange={handleSearchChange}
          onFilterClick={() => setIsFilterOpen(true)}
          onDateClick={() => setIsDateOpen(true)}
          onAddClick={() => setIsManualLogOpen(true)}
          dateLabel={dateLabel || "Date range"}
        />

        <LogTabs
          activeTab={params.status || "all"}
          onTabChange={(status) =>
            updateParams({
              status: status === "all" ? undefined : (status as any),
            })
          }
          counts={statusCounts}
        />
      </div>

      {/* Main Content Area (Scrollable List) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-gray-100 pt-2">
        <LogList
          logs={logs}
          loading={loading}
          onLogClick={(id) => router.push(`/logs/${id}`)}
        />
      </div>

      {/* Dialogs */}
      <FilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) =>
          updateParams({ status: filters.status, source: filters.source })
        }
        initialFilters={{ status: params.status, source: params.source }}
      />

      <DateRangeDialog
        isOpen={isDateOpen}
        onClose={() => setIsDateOpen(false)}
        onApply={(from, to, label) => {
          updateParams({ date_from: from, date_to: to });
          setDateLabel(label || "");
        }}
        currentLabel={dateLabel}
      />

      <ManualLogDialog
        isOpen={isManualLogOpen}
        onClose={() => setIsManualLogOpen(false)}
        onSuccess={() => {
          setIsManualLogOpen(false);
          refresh();
        }}
        resources={resources}
      />
    </div>
  );
}
