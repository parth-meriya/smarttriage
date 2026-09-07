'use client';

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ListFilter, X } from 'lucide-react';
import { Patient } from '@/types/triage';
import { AttentionCard } from '@/components/triage/AttentionCard';
import { PatientRow } from '@/components/triage/PatientRow';
import { useQueue } from '@/hooks/useQueue';

interface DoctorViewProps {
  onOpenPatient: (patient: Patient) => void;
}

export function DoctorView({ onOpenPatient }: DoctorViewProps) {
  const { attentionPatients, waitingPatients, counts, isLiveConnected } = useQueue();
  const [alertDismissed, setAlertDismissed] = useState(false);

  const topEmergencyPatient = attentionPatients[0];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Thursday, September 6, 2026 · 10:44 AM</div>
          <h1>Who needs my attention?</h1>
          <p className="page-subtitle">Good morning, Dr. Rivera. Here is the current clinical priority.</p>
        </div>
        <button className="availability" title={isLiveConnected ? "Real-time live WebSocket connected" : "Auto-polling active"}>
          <span style={isLiveConnected ? { background: '#16a34a', boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.25)' } : undefined} />
          {isLiveConnected ? 'Live' : 'Available'} <ChevronDown size={14} />
        </button>
      </div>

      {!alertDismissed && counts.emergency > 0 && topEmergencyPatient && (
        <div className="alert-strip">
          <AlertCircle size={19} />
          <div>
            <strong>
              {counts.emergency} new emergency patient{counts.emergency > 1 ? 's' : ''}
            </strong>
            <span>Arrived recently and waiting for immediate attention.</span>
          </div>
          <button onClick={() => onOpenPatient(topEmergencyPatient)}>Review now →</button>
          <button
            onClick={() => setAlertDismissed(true)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            aria-label="Dismiss alert"
          >
            <X size={17} />
          </button>
        </div>
      )}

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
          {attentionPatients.slice(0, 2).map((p) => (
            <AttentionCard key={p.name} patient={p} onOpen={onOpenPatient} />
          ))}
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
          {waitingPatients.map((p) => (
            <PatientRow key={p.name} patient={p} onOpen={onOpenPatient} />
          ))}
        </div>
      </section>
    </>
  );
}
