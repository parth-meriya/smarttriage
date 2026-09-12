'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MyQueueStatusDto } from '@/lib/api/types';
import { triageApi } from '@/lib/api/services';
import { useAuth } from './useAuth';

/**
 * Live queue state for the authenticated patient.
 *
 * Source of truth is the backend `/triage/queue/my_status/` endpoint.
 * WebSocket events (`patient_queue_update`, `queue_updated`) trigger a
 * refetch so the UI never computes queue data itself. Handles reconnect
 * and resync-on-reconnect automatically.
 */
export function useMyQueue() {
  const { isAuthenticated, user } = useAuth();
  const [queueStatus, setQueueStatus] = useState<MyQueueStatusDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const fetchSeq = useRef(0);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    const seq = ++fetchSeq.current;
    try {
      const data = await triageApi.getMyQueueStatus();
      // Ignore stale responses (e.g. from a superseded request after reconnect)
      if (seq === fetchSeq.current) {
        setQueueStatus(data);
        setError(null);
      }
    } catch (err) {
      if (seq === fetchSeq.current) {
        setQueueStatus(null);
        setError(err instanceof Error ? err : new Error('Failed to fetch queue status'));
      }
    } finally {
      if (seq === fetchSeq.current) setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch + refetch when the session user changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus, user?.id]);

  // WebSocket for instant updates; stale-free because every event triggers
  // an authoritative refetch instead of trusting event payloads.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('smarttriage_access_token');
    if (!token || token.startsWith('demo_token') || token.startsWith('local_token')) {
      // No valid JWT: fall back to polling only
      return;
    }

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/ws/queue/?token=${encodeURIComponent(token)}`;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    let isMounted = true;

    const startPollingFallback = () => {
      if (pollInterval) return;
      pollInterval = setInterval(fetchStatus, 10000);
    };
    const stopPollingFallback = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          attempts = 0;
          setIsLiveConnected(true);
          stopPollingFallback();
          // Resync after reconnect so state is never stale
          fetchStatus();
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (
              payload.type === 'patient_queue_update' ||
              payload.type === 'queue_updated'
            ) {
              fetchStatus();
            }
          } catch {
            // Ignore malformed frames
          }
        };

        ws.onerror = () => {
          if (isMounted) setIsLiveConnected(false);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsLiveConnected(false);
          startPollingFallback();
          // Exponential backoff capped at 30s
          attempts += 1;
          const delay = Math.min(2000 * 2 ** attempts, 30000);
          reconnectTimeout = setTimeout(connect, delay);
        };
      } catch {
        if (isMounted) {
          setIsLiveConnected(false);
          startPollingFallback();
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      stopPollingFallback();
      if (ws) ws.close();
    };
  }, [isAuthenticated, fetchStatus]);

  return {
    queueStatus,
    isLoading,
    error,
    isLiveConnected,
    refetch: fetchStatus,
  };
}
