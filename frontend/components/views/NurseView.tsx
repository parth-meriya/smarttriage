import React from 'react';
import { AlertCircle, Clock3, HeartPulse, Search, ShieldCheck } from 'lucide-react';
import { Patient } from '@/types/triage';
import { mockPatients } from '@/data/mockPatients';
import { PriorityBadge } from '@/components/common/PriorityBadge';

interface NurseViewProps {
  onOpenPatient: (patient: Patient) => void;
}

export function NurseView({ onOpenPatient }: NurseViewProps) {
  const nextPatient = mockPatients[0];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Thursday, September 6, 2026</div>
          <h1>Good morning, Jordan</h1>
          <p className="page-subtitle">Here is what needs your attention first.</p>
        </div>
        <button className="primary-action small" onClick={() => onOpenPatient(nextPatient)}>
          Start next triage <span>→</span>
        </button>
      </div>

      <div className="workflow-cards">
        <div className="workflow-card urgent">
          <AlertCircle size={18} />
          <div>
            <strong>3 patients</strong>
            <span>Need triage</span>
          </div>
          <b>→</b>
        </div>
        <div className="workflow-card">
          <HeartPulse size={18} />
          <div>
            <strong>2 patients</strong>
            <span>Triage in progress</span>
          </div>
          <b>→</b>
        </div>
        <div className="workflow-card">
          <Clock3 size={18} />
          <div>
            <strong>8 patients</strong>
            <span>Waiting for care</span>
          </div>
          <b>→</b>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Patients needing triage</h2>
            <p>New arrivals are ready to be assessed.</p>
          </div>
          <button className="filter-button">
            <Search size={16} /> Search
          </button>
        </div>
        <div className="nurse-list">
          {mockPatients.slice(0, 4).map((p) => (
            <div className="nurse-patient" key={p.name}>
              <div className="avatar patient-avatar">{p.initials}</div>
              <div className="nurse-name">
                <strong>{p.name}</strong>
                <span>
                  {p.age} years · Arrived {p.wait} ago
                </span>
              </div>
              <div className="nurse-complaint">{p.complaint}</div>
              <PriorityBadge level={p.priority} compact />
              <button className="row-action" onClick={() => onOpenPatient(p)}>
                Begin triage <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section safety-note">
        <ShieldCheck size={19} />
        <div>
          <strong>Clinical workflow reminder</strong>
          <p>
            SmartTriage supports your assessment. Always use clinical judgment and follow
            facility protocols.
          </p>
        </div>
      </section>
    </>
  );
}
