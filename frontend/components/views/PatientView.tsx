'use client';

import React, { useState } from 'react';
import { CalendarDays, ShieldCheck, AlertCircle, ChevronRight, Info } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { InfoIcon } from '@/components/common/InfoIcon';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { useAuth } from '@/hooks/useAuth';
import { useMyQueue } from '@/hooks/useMyQueue';

export function PatientView() {
  const { user } = useAuth();
  const { queueStatus, isLoading, isLiveConnected } = useMyQueue();
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const firstName = user?.first_name || (user?.display_name ? user.display_name.split(' ')[0] : 'there');
  const initials = user?.initials || 'PT';

  if (isLoading) {
    return (
      <>
        <div className="patient-welcome">
          <div>
            <div className="eyebrow">Northside Medical Center</div>
            <h1>Hello, {firstName}</h1>
            <p className="page-subtitle">Loading your live queue status…</p>
          </div>
          <div className="patient-top-avatar">{initials}</div>
        </div>
        <section className="patient-status-card">
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <p>Fetching your current queue position…</p>
          </div>
        </section>
      </>
    );
  }

  if (!queueStatus) {
    return (
      <>
        <div className="patient-welcome">
          <div>
            <div className="eyebrow">Northside Medical Center</div>
            <h1>Hello, {firstName}</h1>
            <p className="page-subtitle">Here is the latest update on your visit.</p>
          </div>
          <div className="patient-top-avatar">{initials}</div>
        </div>
        <section className="patient-status-card">
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <p>No active visit found. Please check in at the reception desk.</p>
          </div>
        </section>
      </>
    );
  }

  const s = queueStatus;
  const isEmergency = s.priority === 1;
  const inConsultation = s.status === 'In consultation';
  const completed = s.status === 'Completed';
  const awaitingNurse = s.status === 'Waiting' || s.status === 'Triage in progress';

  // All status copy comes from the backend's next_step / banner fields
  const headline = inConsultation
    ? 'You are currently with the doctor'
    : isEmergency
    ? 'Emergency Priority – Doctor Attention Required'
    : awaitingNurse
    ? 'Waiting for Nurse Assessment'
    : s.banner || 'Waiting for Doctor';

  const estimatedWait =
    inConsultation
      ? 'With doctor now'
      : s.estimated_wait_minutes > 0
      ? `${s.estimated_wait_minutes}–${s.estimated_wait_minutes + s.average_consultation_minutes} min (estimate)`
      : awaitingNurse
      ? 'Being assessed now'
      : 'You are next – please proceed';

  return (
    <>
      <div className="patient-welcome">
        <div>
          <div className="eyebrow">Northside Medical Center</div>
          <h1>Hello, {firstName}</h1>
          <p className="page-subtitle">Here is the latest update on your visit.</p>
        </div>
        <div className="patient-top-avatar">{initials}</div>
      </div>

      {isEmergency && !inConsultation && !completed && (
        <div className="alert-strip" style={{ marginBottom: '16px' }}>
          <AlertCircle size={19} />
          <div>
            <strong>Emergency Priority</strong>
            <span>Doctor attention required. Clinical staff have been alerted.</span>
          </div>
        </div>
      )}

      <section className="patient-status-card">
        <div className="status-card-top">
          <div>
            <span className="live-label">
              <span />
              Current status · {isLiveConnected ? 'live' : 'auto-sync'}
            </span>
            <h2>{headline}</h2>
          </div>
          <StatusBadge>{s.status}</StatusBadge>
        </div>

        {!inConsultation && !completed && !awaitingNurse && (
          <div className="queue-position">
            <div>
              <span>Your queue position</span>
              <strong>#{s.queue_position}</strong>
              <small>{s.patients_ahead} patient{s.patients_ahead === 1 ? '' : 's'} before you</small>
            </div>
            <div className="position-divider" />
            <div>
              <span>Estimated wait</span>
              <strong>{estimatedWait}</strong>
              <small>Estimate only · not a guarantee</small>
            </div>
          </div>
        )}

        {awaitingNurse && (
          <div className="queue-position">
            <div>
              <span>Step</span>
              <strong>Nurse assessment</strong>
              <small>Triage level will be assigned after assessment</small>
            </div>
            <div className="position-divider" />
            <div>
              <span>Checked in</span>
              <strong>
                {s.arrived_at
                  ? new Date(s.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now'}
              </strong>
              <small>A nurse will see you shortly</small>
            </div>
          </div>
        )}

        <div className="patient-instruction">
          <InfoIcon />
          <span>
            {inConsultation
              ? 'Your examination is underway. Please discuss all your symptoms with your physician.'
              : isEmergency
              ? 'A clinical team has been notified and will attend to you immediately.'
              : awaitingNurse
              ? 'A nurse will assess your vital signs and assign your triage level. Please remain in the waiting area.'
              : 'Please remain available in the waiting area. We will call you when the doctor is ready.'}
          </span>
        </div>
      </section>

      <div className="patient-columns">
        <section className="simple-card">
          <div className="card-title">
            <CalendarDays size={18} />
            <h2>Today&apos;s visit</h2>
          </div>
          <div className="visit-line">
            <span>Visit ID</span>
            <strong>{s.ticket_number}</strong>
          </div>
          <div className="visit-line">
            <span>Triage level</span>
            <PriorityBadge level={s.priority} />
          </div>
          <div className="visit-line">
            <span>Status</span>
            <StatusBadge>{s.status}</StatusBadge>
          </div>
          <div className="visit-line">
            <span>Next step</span>
            <strong>{s.next_step || 'Waiting'}</strong>
          </div>

          {showDetails && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted)' }}>Average consultation time used:</span>
                <strong>{s.average_consultation_minutes} min</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Queue last synced:</span>
                <strong>{new Date().toLocaleTimeString()}</strong>
              </div>
            </div>
          )}

          <button className="secondary-action" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide visit details' : 'View visit details'} <span>{showDetails ? '↑' : '→'}</span>
          </button>
        </section>

        <section className="simple-card">
          <div className="card-title">
            <ShieldCheck size={18} />
            <h2>Need help?</h2>
          </div>
          <p className="help-copy">
            If your symptoms change or become more severe, please tell a member of staff right away.
          </p>

          {showHelp && (
            <div style={{ margin: '10px 0', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '11px', color: 'var(--muted)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Patients are seen by medical urgency (triage level), not arrival time. Within the
                  same urgency level, patients are seen in arrival order. Waiting times shown are
                  estimates calculated from the current queue.
                </span>
              </div>
            </div>
          )}

          <button className="secondary-action" onClick={() => setShowHelp(!showHelp)}>
            {showHelp ? 'Close guide' : 'How the queue works'} <span>{showHelp ? '↑' : '→'}</span>
          </button>
        </section>
      </div>
    </>
  );
}
