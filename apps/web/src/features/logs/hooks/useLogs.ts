import { useState, useEffect, useCallback, useRef } from "react";
import { logsApi } from "../api/logs.api";
import { Log, LogsQueryParams, StatusCounts } from "../types/logs.types";
import { toast } from "react-hot-toast";

const logsCache: Record<string, any> = {};

export function useLogs(initialParams?: LogsQueryParams) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    total: 0,
    active: 0,
    dispatched: 0,
    resolved: 0,
    cancelled: 0,
    my_logs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<LogsQueryParams>(initialParams || {});

  const fetchLogs = useCallback(
    async (queryParams?: LogsQueryParams) => {
      const currentParams = queryParams || params;

      const cleanParams = Object.fromEntries(
        Object.entries(currentParams).filter(
          ([_, v]) => v !== undefined && v !== "" && v !== "all",
        ),
      );
      const cacheKey = JSON.stringify(cleanParams);

      const isLoadMore =
        currentParams.limit &&
        params.limit &&
        currentParams.limit > params.limit;

      if (logsCache[cacheKey]) {
        setLogs(logsCache[cacheKey].data);
        setMeta(logsCache[cacheKey].meta);
        // We do a background refresh without setting loading to true
      } else {
        if (!isLoadMore) {
          setLogs([]); // clear old logs to show skeleton for new data only if not loading more
        }
        setLoading(true);
      }

      try {
        const result = await logsApi.getLogs(cleanParams as LogsQueryParams);
        logsCache[cacheKey] = result;
        setLogs(result.data);
        setMeta(result.meta);
      } catch (error) {
        console.error("Failed to load logs:", error);
      } finally {
        setLoading(false);
      }
    },
    [params],
  );

  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = await logsApi.getStatusCounts();
      setStatusCounts(counts);
    } catch (error) {
      // Silent fail for counts
    }
  }, []);

  const updateParams = useCallback((newParams: Partial<LogsQueryParams>) => {
    setParams((prev) => {
      const updated = { ...prev, ...newParams };
      // Reset page when filters change (except page changes)
      if (!("page" in newParams)) {
        updated.page = 1;
      }
      return updated;
    });
  }, []);

  const refresh = useCallback(() => {
    fetchLogs();
    fetchStatusCounts();
  }, [fetchLogs, fetchStatusCounts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(params);
    }, 50);
    return () => clearTimeout(timer);
  }, [params, fetchLogs]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  return {
    logs,
    meta,
    statusCounts,
    loading,
    params,
    updateParams,
    refresh,
    setLogs,
  };
}
