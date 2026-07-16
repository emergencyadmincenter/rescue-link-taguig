/**
 * usePersonnel hook
 *
 * Fetches the personnel list from the real backend (GET /api/personnel)
 * and exposes `groups`, `isLoading`, `error`, and a `refresh` function
 * to re-fetch after mutations (e.g. after creating a new personnel account).
 *
 * Search and status filtering are delegated to the backend via query params,
 * so the hook re-fetches whenever either param changes (300 ms debounce is
 * applied in the parent page view before those values reach here).
 */

import { useState, useEffect, useCallback } from "react";
import { getPersonnel, PersonnelGroup } from "../api/personnel.api";
import { PersonnelStatus } from "../types/personnel.types";

interface UsePersonnelParams {
  search?: string;
  status?: PersonnelStatus | "";
}

interface UsePersonnelResult {
  groups: PersonnelGroup[];
  isLoading: boolean;
  error: Error | null;
  /** Call this to manually re-fetch after a mutation (e.g. after creating a personnel). */
  refresh: () => void;
}

export const usePersonnel = (
  params?: UsePersonnelParams,
): UsePersonnelResult => {
  const [groups, setGroups] = useState<PersonnelGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Increment this to trigger a re-fetch from outside
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let isMounted = true;

    const fetchPersonnel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Delegate search & status filtering to the backend.
        // Pass undefined (not empty string) so the query param is omitted entirely.
        const data = await getPersonnel(
          params?.search || undefined,
          params?.status || undefined,
        );

        if (isMounted) {
          setGroups(data.groups);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch personnel"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPersonnel();

    return () => {
      isMounted = false;
    };
    // refreshKey triggers re-fetch on demand (e.g. after create)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.search, params?.status, refreshKey]);

  return { groups, isLoading, error, refresh };
};
