'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, ChevronDown, ListFilter, X, UserCheck, Loader2 } from 'lucide-react';
import { Patient } from '@/types/triage';
import { AttentionCard } from '@/components/triage/AttentionCard';
import { PatientRow } from '@/components/triage/PatientRow';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { triageApi } from '@/lib/api/services';
import { NextPatientDto } from '@/lib/api/types';

interface DoctorViewProps {
  onOpenPatient: (patient: Patient) => void;
}

export function DoctorView({ onOpenPatient }: DoctorViewProps) {
  const { attentionPatients, waitingPatients, counts, isLiveConnected, emergencyAlert } = useQueue();
  const { user } = useAuth();
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [nextPatient, setNextPatient] = useState<NextPatientDto | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const doctorName = user?.display_name || 'Doctor';

  const refreshNextPatient = useCallback(async () => {
    try {
      const next = await triageApi.getNextPatient();
      setNextPatient(next);
    } catch {
      // 404 = empty queue; anything else is also non-fatal for the dashboard
      setNextPatient(null);
    }
  }, []);

  // Load (and keep fresh) the backend-decided next eligible patient
  useEffect(() => {
    refreshNextPatient();
  }, [refreshNextPatient, counts.total_waiting, counts.emergency]);

  const handleOpenNextPatient = async () => {
    if (!nextPatient) return;
    setIsLoadingNext(true);
    try {
      const queueData = await triageApi.getLiveQueue();
      const ticket = queueData.all.find((t) => t.id === nextPatient.ticket_id);
      if (ticket) {
        // Reuse the queue->patient mapping used across the app
        const { ticketToPatient } = await import('@/hooks/useQueue');
        onOpenPatient(ticketToPatient(ticket));
      }
    } finally {
      setIsLoadingNext(false);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const showEmergencyBanner = !alertDismissed && (emergencyAlert || counts.emergency > 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{dateStr} · {timeStr}</div>
          <h1>Who needs my attention?</h1>
          <p className="page-subtitle">Good day, {doctorName}. Here is the current clinical priority.</p>
        </div>
        <button className="availability" title={isLiveConnected ? "Real-time live WebSocket connected" : "Auto-polling active"}>
          <span style={isLiveConnected ? { background: '#16a34a', boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.25)' } : undefined} />
          {isLiveConnected ? 'Live' : 'Available'} <ChevronDown size={14} />
        </button>
      </div>

      {/* Real-time emergency escalation (WebSocket emergency_alert or L1 in queue) */}
      {showEmergencyBanner && (
        <div className="alert-strip">
          <AlertCircle size={19} />
          <div>
            <strong>
              {emergencyAlert
                ? `EMERGENCY PATIENT: ${emergencyAlert.patient_name} (L1)`
                : `${counts.emergency} emergency patient${counts.emergency > 1 ? 's' : ''} waiting`}
            </strong>
            <span>
              {emergencyAlert?.complaint || 'Arrived recently and waiting for immediate attention.'}
            </span>
          </div>
          <button onClick={handleOpenNextPatient}>
            {nextPatient?.is_emergency ? 'See patient now →' : 'Review now →'}
          </button>
          <button
            onClick={() => setAlertDismissed(true)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            aria-label="Dismiss alert"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Backend-decided next eligible patient (strict priority order) */}
      <section className="section" style={{ marginBottom: '4px' }}>
        <div
          className="workflow-card"
          style={{
            display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '560px',
            borderLeft: nextPatient?.is_emergency ? '4px solid #ef4444' : '4px solid #0f8b8d',
          }}
        >
          <UserCheck size={22} style={{ color: nextPatient?.is_emergency ? '#ef4444' : '#0f8b8d' }} />
          {nextPatient ? (
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '14px' }}>
                Next patient: {nextPatient.patient_name} · L{nextPatient.priority}
              </strong>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                {nextPatient.complaint} · position #{nextPatient.queue_position}
                {nextPatient.queue_position > 1 ? ` · ${nextPatient.estimated_wait_minutes} min wait` : ' · ready now'}
              </span>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '14px' }}>No patients waiting</strong>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                The priority queue is empty.
              </span>
            </div>
          )}
          <button
            className="primary-action small"
            onClick={handleOpenNextPatient}
            disabled={!nextPatient || isLoadingNext}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isLoadingNext ? (
              <><Loader2 size={14} className="animate-spin" /> Opening…</>
            ) : (
              <>Open next patient <span>→</span></>
            )}
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Needs attention now</h2>
            <p>Start with patients requiring the most urgent assessment.</p>
          </div>
          <button className="text-button">
            View all {attentionPatients.length} <span>→</span>
          </button>
        </div>
        <div className="attention-grid">
          {attentionPatients.slice(0, 2).map((p, idx) => (
            <AttentionCard key={p.id ? `att-${p.id}` : p.mrn ? `mrn-${p.mrn}` : `${p.name}-${idx}`} patient={p} onOpen={onOpenPatient} />
          ))}
          {attentionPatients.length === 0 && (
            <div style={{ padding: '20px', color: 'var(--muted-foreground)', fontSize: '13px' }}>
              No L1/L2 patients waiting.
            </div>
          )}
        </div>
      </section>

      <section className="section queue-section">
        <div className="section-heading">
          <div>
            <h2>Waiting for assessment</h2>
            <p>Sorted by urgency, then waiting time.</p>
          </div>
          <div className="heading-actions">
            <button className="filter-button">
              <ListFilter size={16} /> Filter
            </button>
            <button className="text-button">Open queue →</button>
          </div>
        </div>
        <div className="queue-table">
          <div className="queue-header">
            <span>Patient</span>
            <span>Reason for visit</span>
            <span>Priority</span>
            <span>Vitals</span>
            <span>Wait time</span>
            <span>Status</span>
            <span />
          </div>
          {waitingPatients.map((p, idx) => (
            <PatientRow key={p.id ? `row-${p.id}` : p.mrn ? `mrn-${p.mrn}` : `${p.name}-${idx}`} patient={p} onOpen={onOpenPatient} />
          ))}
          {waitingPatients.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
              No additional patients in the queue.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
