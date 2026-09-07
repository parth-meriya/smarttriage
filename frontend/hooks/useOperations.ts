'use client';

import { useState, useEffect, useCallback } from 'react';
import { triageApi } from '@/lib/api/services';
import { OperationsMetricsResponse } from '@/lib/api/types';
import { useAuth } from './useAuth';

const DEFAULT_METRICS: OperationsMetricsResponse = {
  operations: {
    arrivals: 24,
    arrivals_delta: '+4 from yesterday',
    waiting: 12,
    waiting_subtext: '8 under 30 min',
    in_triage: 3,
    in_triage_subtext: '2 nurses active',
    with_doctor: 5,
    with_doctor_subtext: '3 rooms occupied',
    completed: 18,
    completed_subtext: 'Today',
  },
  queue_overview: [
    { label: 'Emergency', count: 1, color: 'red' },
    { label: 'High priority', count: 2, color: 'amber' },
    { label: 'Urgent', count: 5, color: 'gold' },
    { label: 'Non-urgent', count: 4, color: 'teal' },
  ],
  recent_activity: [
    {
      id: 1,
      time_display: '10:42 AM',
      event_type: 'Triage completed',
      patient_name: 'David Kim',
      description: 'Triage Level 3 assigned',
    },
    {
      id: 2,
      time_display: '10:39 AM',
      event_type: 'Vitals recorded',
      patient_name: 'Eleanor Wright',
      description: 'Temperature 38.4°C recorded',
    },
    {
      id: 3,
      time_display: '10:35 AM',
      event_type: 'Patient registered',
      patient_name: 'Aisha Patel',
      description: 'Registration intake completed',
    },
    {
      id: 4,
      time_display: '10:31 AM',
      event_type: 'Consultation started',
      patient_name: 'Maria Santos',
      description: 'Dr. Alex Rivera in room A-02',
    },
  ],
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
