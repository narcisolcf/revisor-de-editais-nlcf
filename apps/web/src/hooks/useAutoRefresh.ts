import { useState, useEffect, useCallback, useRef } from 'react';

export interface RefreshStatus {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  error: string | null;
  success: boolean;
}

export interface UseAutoRefreshOptions {
  enabled?: boolean;
  interval?: number; // in seconds
  onRefresh: () => Promise<void>;
}

export function useAutoRefresh({
  enabled = false,
  interval = 300, // 5 minutes default
  onRefresh,
}: UseAutoRefreshOptions) {
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>({
    isRefreshing: false,
    lastRefresh: null,
    nextRefresh: null,
    error: null,
    success: false,
  });

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enabled);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(interval);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Calculate next refresh time
  const calculateNextRefresh = useCallback(() => {
    if (!autoRefreshEnabled) return null;
    return new Date(Date.now() + autoRefreshInterval * 1000);
  }, [autoRefreshEnabled, autoRefreshInterval]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setRefreshStatus((prev) => ({
      ...prev,
      isRefreshing: true,
      error: null,
      success: false,
    }));

    try {
      await onRefresh();
      const now = new Date();
      setRefreshStatus((prev) => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: now,
        nextRefresh: calculateNextRefresh(),
        error: null,
        success: true,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setRefreshStatus((prev) => ({
        ...prev,
        isRefreshing: false,
        error: errorMessage,
        success: false,
        nextRefresh: calculateNextRefresh(),
      }));
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onRefresh, calculateNextRefresh]);

  // Setup auto refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!autoRefreshEnabled) {
      setRefreshStatus((prev) => ({
        ...prev,
        nextRefresh: null,
      }));
      return;
    }

    // Set initial next refresh time
    setRefreshStatus((prev) => ({
      ...prev,
      nextRefresh: calculateNextRefresh(),
    }));

    // Setup interval
    intervalRef.current = setInterval(() => {
      if (!isRefreshingRef.current) {
        handleRefresh();
      }
    }, autoRefreshInterval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, autoRefreshInterval, handleRefresh, calculateNextRefresh]);

  // Handle auto refresh toggle
  const handleAutoRefreshChange = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
  }, []);

  // Handle interval change
  const handleIntervalChange = useCallback((newInterval: number) => {
    setAutoRefreshInterval(newInterval);
  }, []);

  // Reset success/error status after some time
  useEffect(() => {
    if (refreshStatus.success || refreshStatus.error) {
      const timer = setTimeout(() => {
        setRefreshStatus((prev) => ({
          ...prev,
          success: false,
          error: null,
        }));
      }, 5000); // Clear status after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [refreshStatus.success, refreshStatus.error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    refreshStatus,
    autoRefreshEnabled,
    autoRefreshInterval,
    handleRefresh,
    handleAutoRefreshChange,
    handleIntervalChange,
  };
}

export default useAutoRefresh;