'use client';

import React from 'react';
import { AlertCircle, Clock3, HeartPulse, Search, ShieldCheck } from 'lucide-react';
import { Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { useAuth } from '@/hooks/useAuth';
import { useQueue } from '@/hooks/useQueue';

interface NurseViewProps {
  onOpenPatient: (patient: Patient) => void;
}

export function NurseView({ onOpenPatient }: NurseViewProps) {
  const { user } = useAuth();
  const { attentionPatients, waitingPatients, counts } = useQueue();

  const allPatients = [...attentionPatients, ...waitingPatients];
  const nextPatient = allPatients[0];
  const needingTriageCount = counts.emergency + counts.high_priority;
  const nurseName = user?.first_name || 'Jordan';

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Thursday, September 6, 2026</div>
          <h1>Good morning, {nurseName}</h1>
          <p className="page-subtitle">Here is what needs your attention first.</p>
        </div>
        {nextPatient && (
          <button className="primary-action small" onClick={() => onOpenPatient(nextPatient)}>
            Start next triage <span>→</span>
          </button>
        )}
      </div>

      <div className="workflow-cards">
        <div className="workflow-card urgent">
          <AlertCircle size={18} />
          <div>
            <strong>{needingTriageCount} patients</strong>
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
            <strong>{counts.total_waiting} patients</strong>
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
          {allPatients.slice(0, 5).map((p) => (
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
