import React from 'react';
import { Activity, Clock3 } from 'lucide-react';
import { Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';

interface PatientRowProps {
  patient: Patient;
  onOpen: (patient: Patient) => void;
}

export function PatientRow({ patient, onOpen }: PatientRowProps) {
  return (
    <div className={`patient-row priority-${patient.priority}`}>
      <div className="patient-person">
        <div className="avatar patient-avatar">{patient.initials}</div>
        <div>
          <strong>{patient.name}</strong>
          <span>
            {patient.age} years · {patient.room}
          </span>
        </div>
      </div>
      <div className="complaint">{patient.complaint}</div>
      <div>
        <PriorityBadge level={patient.priority} compact />
      </div>
      <div className="vital-inline">
        <Activity size={14} />
        {patient.vital}
      </div>
      <div className="wait">
        <Clock3 size={14} />
        {patient.wait}
      </div>
      <StatusBadge>{patient.status}</StatusBadge>
      <button className="row-action" onClick={() => onOpen(patient)}>
        Open <span>→</span>
      </button>
    </div>
  );
}
