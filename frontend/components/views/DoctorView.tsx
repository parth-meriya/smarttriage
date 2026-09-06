import React from 'react';
import { AlertCircle, ChevronDown, ListFilter, X } from 'lucide-react';
import { Patient } from '@/types/triage';
import { mockPatients } from '@/data/mockPatients';
import { AttentionCard } from '@/components/triage/AttentionCard';
import { PatientRow } from '@/components/triage/PatientRow';

interface DoctorViewProps {
  onOpenPatient: (patient: Patient) => void;
}

export function DoctorView({ onOpenPatient }: DoctorViewProps) {
  const emergencyPatient = mockPatients[0];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Thursday, September 6, 2026 · 10:44 AM</div>
          <h1>Who needs my attention?</h1>
          <p className="page-subtitle">Good morning, Dr. Rivera. Here is the current clinical priority.</p>
        </div>
        <button className="availability">
          <span />
          Available <ChevronDown size={14} />
        </button>
      </div>

      <div className="alert-strip">
        <AlertCircle size={19} />
        <div>
          <strong>1 new emergency patient</strong>
          <span>Arrived 2 minutes ago and is waiting for immediate attention.</span>
        </div>
        <button onClick={() => onOpenPatient(emergencyPatient)}>Review now →</button>
        <X size={17} />
      </div>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Needs attention now</h2>
            <p>Start with patients requiring the most urgent assessment.</p>
          </div>
          <button className="text-button">
            View all 3 <span>→</span>
          </button>
        </div>
        <div className="attention-grid">
          <AttentionCard patient={mockPatients[0]} onOpen={onOpenPatient} />
          <AttentionCard patient={mockPatients[1]} onOpen={onOpenPatient} />
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
          {mockPatients.slice(2).map((p) => (
            <PatientRow key={p.name} patient={p} onOpen={onOpenPatient} />
          ))}
        </div>
      </section>
    </>
  );
}
