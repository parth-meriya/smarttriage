'use client';

import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/types/triage';
import { triageApi } from '@/lib/api/services';
import { QueueTicketDto } from '@/lib/api/types';
import { useAuth } from './useAuth';

export function ticketToPatient(t: QueueTicketDto): Patient {
  let spo2Val: number | undefined;
  let bpVal: string | undefined;
  let hrVal: number | undefined;
  let tempVal: string | undefined;

  if (t.vital.includes('SpO₂')) {
    const match = t.vital.match(/\d+/);
    if (match) spo2Val = parseInt(match[0], 10);
  } else if (t.vital.includes('BP')) {
    bpVal = t.vital.replace('BP ', '');
  } else if (t.vital.includes('HR')) {
    const match = t.vital.match(/\d+/);
    if (match) hrVal = parseInt(match[0], 10);
  } else if (t.vital.includes('Temp')) {
    tempVal = t.vital.replace('Temp ', '');
  }

  return {
    id: t.id,
    patientId: t.patient_id,
    name: t.name,
    initials: t.initials,
    age: t.age,
    gender: t.gender,
    mrn: t.ticket_number,
    complaint: t.complaint,
    priority: t.priority as 1 | 2 | 3 | 4,
    wait: t.wait,
    vital: t.vital,
    status: t.status,
    room: t.room,
    registeredAt: t.arrived_at
      ? `Registered today at ${new Date(t.arrived_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : undefined,
    spo2: spo2Val,
    heartRate: hrVal,
    bloodPressure: bpVal,
    temperature: tempVal,
  };
}

export function useQueue() {
  const { isAuthenticated } = useAuth();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [attentionPatients, setAttentionPatients] = useState<Patient[]>([]);
  const [waitingPatients, setWaitingPatients] = useState<Patient[]>([]);
  const [counts, setCounts] = useState({
    emergency: 0,
    high_priority: 0,
    urgent: 0,
    non_urgent: 0,
    total_waiting: 0,
    triage_in_progress: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [emergencyAlert, setEmergencyAlert] = useState<any | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await triageApi.getLiveQueue();
      if (data && data.attention && data.waiting) {
        const att = data.attention.map(ticketToPatient);
        const wait = data.waiting.map(ticketToPatient);
        setAttentionPatients(att);
        setWaitingPatients(wait);

        if (data.all && data.all.length > 0) {
          setAllPatients(data.all.map(ticketToPatient));
        } else {
          const seen = new Set<string>();
          const uniqueList: Patient[] = [];
          for (const p of [...att, ...wait]) {
            const key = p.mrn || p.name;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueList.push(p);
            }
          }
          setAllPatients(uniqueList);
        }

        setCounts({
          ...data.counts,
          triage_in_progress: data.counts.triage_in_progress ?? 0,
        });
        setError(null);
      }
    } catch (err) {
      // Graceful fallback to prototype mock data on network error
      setError(err instanceof Error ? err : new Error('Failed to fetch live queue'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSockets for instant live feed synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // The queue consumer authenticates via JWT in the query string.
    // Demo/local placeholder tokens cannot authenticate, so skip the
    // socket entirely and rely on the polling fallback below.
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('smarttriage_access_token') : null;
    const hasRealToken = !!storedToken && !storedToken.startsWith('demo_token') && !storedToken.startsWith('local_token');

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/ws/queue/${hasRealToken ? `?token=${encodeURIComponent(storedToken!)}` : ''}`;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    function connect() {
      if (!hasRealToken) {
        if (isMounted) setIsLiveConnected(false);
        return;
      }
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isMounted) setIsLiveConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'queue_updated') {
              fetchQueue();
              // Queue events often accompany notification creation server-side
              window.dispatchEvent(new CustomEvent('smarttriage:refresh-notifications'));
            } else if (payload.type === 'emergency_alert') {
              fetchQueue();
              if (isMounted) {
                setEmergencyAlert(payload.data);
              }
              window.dispatchEvent(new CustomEvent('smarttriage:refresh-notifications'));
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          if (isMounted) setIsLiveConnected(false);
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsLiveConnected(false);
            reconnectTimeout = setTimeout(connect, 4000);
          }
        };
      } catch {
        if (isMounted) setIsLiveConnected(false);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [fetchQueue]);

  // Polling fallback every 6 seconds (or 15 seconds if WebSocket is connected)
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, isLiveConnected ? 15000 : 6000);
    return () => clearInterval(interval);
  }, [fetchQueue, isAuthenticated, isLiveConnected]);

  return {
    allPatients,
    attentionPatients,
    waitingPatients,
    counts,
    isLoading,
    error,
    isLiveConnected,
    emergencyAlert,
    refetch: fetchQueue,
  };
}
