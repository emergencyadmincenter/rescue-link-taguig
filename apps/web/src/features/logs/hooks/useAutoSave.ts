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

  const save = useCallback(async (data: Record<string, unknown>) => {
    if (savingRef.current) {
      pendingRef.current = data;
      return;
    }
    savingRef.current = true;
    try {
      await onSave(data);
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        const next = pendingRef.current;
        pendingRef.current = null;
        save(next);
      }
    }
  }, [onSave]);

  const debouncedSave = useCallback((data: Record<string, unknown>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(data), debounceMs);
  }, [save, debounceMs]);

  const immediateSave = useCallback((data: Record<string, unknown>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    save(data);
  }, [save]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { debouncedSave, immediateSave, isSaving: savingRef.current };
}
