import { useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface UseAutoSaveOptions {
  onSave: (data: Record<string, unknown>) => Promise<unknown>;
  debounceMs?: number;
}

export function useAutoSave({ onSave, debounceMs = 800 }: UseAutoSaveOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<Record<string, unknown> | null>(null);
  const savingRef = useRef(false);
  const accumulatedDataRef = useRef<Record<string, unknown>>({});

  const save = useCallback(async (data: Record<string, unknown>) => {
    if (Object.keys(data).length === 0) return;
    
    if (savingRef.current) {
      pendingRef.current = { ...(pendingRef.current || {}), ...data };
      return;
    }
    savingRef.current = true;
    try {
      await onSave(data);
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      savingRef.current = false;
      if (pendingRef.current && Object.keys(pendingRef.current).length > 0) {
        const next = pendingRef.current;
        pendingRef.current = null;
        save(next);
      }
    }
  }, [onSave]);

  const debouncedSave = useCallback((data: Record<string, unknown>) => {
    accumulatedDataRef.current = { ...accumulatedDataRef.current, ...data };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const dataToSave = accumulatedDataRef.current;
      accumulatedDataRef.current = {};
      save(dataToSave);
    }, debounceMs);
  }, [save, debounceMs]);

  const immediateSave = useCallback((data: Record<string, unknown>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const dataToSave = { ...accumulatedDataRef.current, ...data };
    accumulatedDataRef.current = {};
    save(dataToSave);
  }, [save]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (Object.keys(accumulatedDataRef.current).length > 0) {
          save(accumulatedDataRef.current);
          accumulatedDataRef.current = {};
        }
      }
    };
  }, [save]);

  return { debouncedSave, immediateSave, isSaving: savingRef.current };
}
