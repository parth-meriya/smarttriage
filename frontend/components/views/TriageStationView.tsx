'use client';

import React from 'react';
import { HeartPulse, AlertCircle, Clock3, ChevronRight, Activity, ShieldCheck } from 'lucide-react';
import { Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { useQueue } from '@/hooks/useQueue';

interface TriageStationViewProps {
  onOpenPatient: (patient: Patient) => void;
}

export function TriageStationView({ onOpenPatient }: TriageStationViewProps) {
  const { allPatients, counts } = useQueue();

  // Patients that are unassessed or high priority
  const needingTriage = allPatients.filter(
    (p) => !p.vitals || p.status === 'Needs triage' || p.priority === 'Level 1' || p.priority === 'Level 2' || p.priority === 'Emergency'
  );

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Nurse Triage Assessment Desk</div>
          <h1>Triage Station</h1>
          <p className="page-subtitle">Conduct initial nursing intake, record vital signs, and assign clinical ESI levels.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            background: '#e0f2fe',
            color: '#0369a1',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            Triage Desk 1 Active
          </div>
        </div>
      </div>

      <div className="workflow-cards" style={{ marginBottom: '24px' }}>
        <div className="workflow-card urgent">
          <AlertCircle size={20} />
          <div>
            <strong>{counts.emergency + counts.high_priority} Patients</strong>
            <span>Urgent assessment queue</span>
          </div>
        </div>
        <div className="workflow-card">
          <HeartPulse size={20} />
          <div>
            <strong>ESI 5-Level System</strong>
            <span>Active triage protocol</span>
          </div>
        </div>
        <div className="workflow-card">
          <ShieldCheck size={20} />
          <div>
            <strong>AI Assist Active</strong>
            <span>Real-time clinical acuity score</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Patients Awaiting Triage Assessment</h2>
            <p>Select any patient to record vitals and generate triage recommendations.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {allPatients.map((patient, idx) => {
            const isUrgent = patient.priority === 'Level 1' || patient.priority === 'Emergency';
            return (
              <div
                key={patient.id || patient.mrn || idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderLeft: isUrgent ? '4px solid #ef4444' : '4px solid #0f8b8d',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                  <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '13px' }}>
                    {patient.initials || patient.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>
                      {patient.name}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      MRN: {patient.mrn || 'ST-2048'} · {patient.age ? `${patient.age}y` : ''} {patient.gender || ''}
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    {patient.complaint}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    <span>Wait: <strong>{patient.wait_time || '8 min'}</strong></span>
                    <span>Arrival: {patient.arrival_time || 'Just now'}</span>
                  </div>
                </div>

                <div>
                  <PriorityBadge priority={patient.priority} />
                </div>

                <div>
                  <button
                    className="primary-action small"
                    onClick={() => onOpenPatient(patient)}
                    style={{
                      background: '#0f8b8d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Start Triage</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
