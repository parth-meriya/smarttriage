'use client';

import React, { useState } from 'react';
import { CalendarDays, ShieldCheck, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { InfoIcon } from '@/components/common/InfoIcon';
import { useAuth } from '@/hooks/useAuth';
import { useQueue } from '@/hooks/useQueue';

export function PatientView() {
  const { user } = useAuth();
  const { allPatients, counts } = useQueue();
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const firstName = user?.first_name || (user?.display_name ? user.display_name.split(' ')[0] : 'Jamie');
  const initials = user?.initials || 'JS';

  // Match the patient's ticket if present in queue by name, username, or MRN
  const myPatient =
    allPatients.find(
      (p) =>
        (firstName && firstName.length > 1 && p.name.toLowerCase().includes(firstName.toLowerCase())) ||
        (user?.last_name && user.last_name.length > 1 && p.name.toLowerCase().includes(user.last_name.toLowerCase())) ||
        (user?.username && p.mrn && p.mrn.toLowerCase().includes(user.username.toLowerCase()))
    ) ||
    allPatients.find((p) => p.name.toLowerCase().includes('jamie')) ||
    allPatients[0] ||
    null;

  if (!myPatient) {
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

  const queueIndex = allPatients.findIndex((p) => p.name === myPatient.name);
  const queuePosition = queueIndex !== -1 ? queueIndex + 1 : 1;
  const totalWaiting = counts.total_waiting || allPatients.length || 1;
  const estimatedWait = `~${queuePosition * 5} min`;
  const visitId = myPatient.mrn || 'ST-2048';
  const currentStatus = myPatient.status || 'Waiting';

  const nextStep =
    currentStatus === 'In consultation'
      ? 'Doctor consultation in progress'
      : currentStatus === 'Triage complete'
      ? 'Doctor examination'
      : currentStatus === 'Triage in progress'
      ? 'Nurse clinical triage'
      : 'Nurse assessment';

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
        <div className="status-card-top">
          <div>
            <span className="live-label">
              <span />
              Current status
            </span>
            <h2>{currentStatus === 'In consultation' ? 'You are currently with a doctor' : 'Your visit is in progress'}</h2>
          </div>
          <StatusBadge>{currentStatus}</StatusBadge>
        </div>

        <div className="queue-position">
          <div>
            <span>Your queue position</span>
            <strong>{currentStatus === 'In consultation' ? 'Now' : queuePosition}</strong>
            <small>
              {currentStatus === 'In consultation'
                ? 'Currently in examination'
                : `of ${totalWaiting} patients waiting`}
            </small>
          </div>
          <div className="position-divider" />
          <div>
            <span>Estimated wait</span>
            <strong>{currentStatus === 'In consultation' ? '0 min' : estimatedWait}</strong>
            <small>Updated live · priority based</small>
          </div>
        </div>

        <div className="patient-instruction">
          <InfoIcon />
          <span>
            {currentStatus === 'In consultation'
              ? 'Your examination is underway. Please discuss all your symptoms with your physician.'
              : 'Please remain available in the waiting area. We will call your name when it is time for your assessment.'}
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
            <strong>{visitId}</strong>
          </div>
          <div className="visit-line">
            <span>Status</span>
            <StatusBadge>{currentStatus}</StatusBadge>
          </div>
          <div className="visit-line">
            <span>Next step</span>
            <strong>{nextStep}</strong>
          </div>

          {showDetails && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted)' }}>Reported complaint:</span>
                <strong>{myPatient.complaint || 'Mild dizziness and headache'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted)' }}>Assigned room:</span>
                <strong>{myPatient.room || 'Waiting Area B'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Vitals recorded:</span>
                <strong>{myPatient.vital || 'SpO₂ 98% · HR 74'}</strong>
              </div>
            </div>
          )}

          <button
            className="secondary-action"
            onClick={() => setShowDetails(!showDetails)}
          >
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
              Emergency departments use the <strong>Manchester Triage System</strong> to prioritize patients based on medical urgency rather than arrival time. Life-threatening conditions are assessed immediately.
            </div>
          )}

          <button
            className="secondary-action"
            onClick={() => setShowHelp(!showHelp)}
          >
            {showHelp ? 'Close guide' : 'How triage works'} <span>{showHelp ? '↑' : '→'}</span>
          </button>
        </section>
      </div>
    </>
  );
}
