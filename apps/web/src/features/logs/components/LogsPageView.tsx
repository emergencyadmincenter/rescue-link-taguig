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
import { useAuth } from "@/providers/AuthProvider";
import { FiX } from "react-icons/fi";

export default function LogsPageView() {
  const router = useRouter();
  const { logs, loading, meta, params, updateParams, statusCounts, refresh } =
    useLogs();
  const { user } = useAuth();

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

  const activeTab = params.status || "all";

  const handleTabChange = (tab: string) => {
    if (tab === "all") {
      updateParams({ status: undefined });
    } else {
      updateParams({ status: tab as any });
    }
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

        <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
          {params.source && (
            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
              Source: {params.source}
              <button
                onClick={() => updateParams({ source: undefined })}
                className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {params.is_shadow_banned && (
            <span className="flex items-center gap-1.5 bg-danger/10 text-danger text-xs font-semibold px-2.5 py-1 rounded-full border border-danger/20">
              Shadow Banned: {params.is_shadow_banned === "true" ? "Yes" : "No"}
              <button
                onClick={() => updateParams({ is_shadow_banned: undefined })}
                className="hover:bg-danger/20 rounded-full p-0.5 transition-colors"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {(params.date_from || params.date_to) && (
            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
              Date: {dateLabel || "Custom"}
              <button
                onClick={() => {
                  updateParams({ date_from: undefined, date_to: undefined });
                  setDateLabel("");
                }}
                className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
          <LogTabs
            activeTab={activeTab as any}
            onTabChange={handleTabChange}
            counts={statusCounts}
          />
          <button
            onClick={() =>
              updateParams({
                assigned_coordinator_id: params.assigned_coordinator_id
                  ? undefined
                  : user?.id,
              })
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all shadow-sm ${params.assigned_coordinator_id ? "border-primary bg-primary text-white hover:bg-primary-hover shadow-primary/20" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            My Assignments
          </button>
        </div>
      </div>

      {/* Main Content Area (Scrollable List) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-gray-100 pt-2 pb-10">
        <LogList
          logs={logs}
          loading={loading}
          onLogClick={(id) => router.push(`/logs/${id}`)}
          onStatusChange={async (id, status) => {
            try {
              await logsApi.updateLog(id, { status });
              refresh();
            } catch (err) {
              console.error("Failed to update status", err);
            }
          }}
        />

        {meta.page < meta.totalPages && (
          <div className="w-full flex justify-center mt-6">
            <button
              onClick={() => updateParams({ limit: (params.limit || 20) + 20 })}
              disabled={loading}
              className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-medium text-sm transition-colors border border-gray-200 shadow-sm disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More Logs"}
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <FilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) =>
          updateParams({
            status: filters.status,
            source: filters.source,
            is_shadow_banned: filters.is_shadow_banned,
          })
        }
        initialFilters={{
          status: params.status,
          source: params.source,
          is_shadow_banned: params.is_shadow_banned,
        }}
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
