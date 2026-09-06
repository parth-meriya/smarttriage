import React from 'react';
import { Activity, Clock3 } from 'lucide-react';
import { Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';

interface AttentionCardProps {
  patient: Patient;
  onOpen: (patient: Patient) => void;
}

export function AttentionCard({ patient, onOpen }: AttentionCardProps) {
  return (
    <article className={`attention-card level-${patient.priority}`}>
      <div className="attention-top">
        <PriorityBadge level={patient.priority} />
        <span className="new-label">
          {patient.priority === 1 ? 'Immediate attention' : 'Needs review'}
        </span>
      </div>
      <div className="attention-body">
        <div className="avatar patient-avatar large">{patient.initials}</div>
        <div>
          <h3>{patient.name}</h3>
          <p>
            {patient.age} years · {patient.complaint}
          </p>
        </div>
      </div>
      <div className="attention-meta">
        <span>
          <Activity size={15} /> <strong>{patient.vital}</strong>
        </span>
        <span>
          <Clock3 size={15} /> Waiting {patient.wait}
        </span>
        <StatusBadge>{patient.status}</StatusBadge>
      </div>
      <button className="primary-action" onClick={() => onOpen(patient)}>
        Open patient <span>→</span>
      </button>
    </article>
  );
}
