'use client';

import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/types/triage';
import { mockPatients } from '@/data/mockPatients';
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
  const [attentionPatients, setAttentionPatients] = useState<Patient[]>(mockPatients.slice(0, 2));
  const [waitingPatients, setWaitingPatients] = useState<Patient[]>(mockPatients.slice(2));
  const [counts, setCounts] = useState({
    emergency: 1,
    high_priority: 2,
    urgent: 5,
    non_urgent: 4,
    total_waiting: 6,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await triageApi.getLiveQueue();
      if (data && data.attention && data.waiting) {
        setAttentionPatients(data.attention.map(ticketToPatient));
        setWaitingPatients(data.waiting.map(ticketToPatient));
        setCounts(data.counts);
        setError(null);
      }
    } catch (err) {
      // Graceful fallback to prototype mock data on network error
      setError(err instanceof Error ? err : new Error('Failed to fetch live queue'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Refresh queue every 5 seconds
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue, isAuthenticated]);

  return {
    attentionPatients,
    waitingPatients,
    counts,
    isLoading,
    error,
    refetch: fetchQueue,
  };
}
