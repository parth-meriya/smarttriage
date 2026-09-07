'use client';

import { useState, useEffect, useCallback } from 'react';
import { triageApi } from '@/lib/api/services';
import { OperationsMetricsResponse } from '@/lib/api/types';
import { useAuth } from './useAuth';

const DEFAULT_METRICS: OperationsMetricsResponse = {
  operations: {
    arrivals: 0,
    arrivals_delta: '+0 from yesterday',
    waiting: 0,
    waiting_subtext: '0 under 30 min',
    in_triage: 0,
    in_triage_subtext: '0 nurses active',
    with_doctor: 0,
    with_doctor_subtext: '0 rooms occupied',
    completed: 0,
    completed_subtext: 'Today',
  },
  queue_overview: [
    { label: 'Emergency', count: 0, color: 'red' },
    { label: 'High priority', count: 0, color: 'amber' },
    { label: 'Urgent', count: 0, color: 'gold' },
    { label: 'Non-urgent', count: 0, color: 'teal' },
  ],
  recent_activity: [],
};

export function useOperations() {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<OperationsMetricsResponse>(DEFAULT_METRICS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await triageApi.getOperationsMetrics();
      if (data && data.operations) {
        setMetrics(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch operations metrics'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics, isAuthenticated]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
