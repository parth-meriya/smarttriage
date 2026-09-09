'use client';

import React, { useState } from 'react';
import { AlertCircle, Clock3, HeartPulse, Search, ShieldCheck, X, UserPlus } from 'lucide-react';
import { Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { useAuth } from '@/hooks/useAuth';
import { useQueue } from '@/hooks/useQueue';
import { NurseAddPatientModal } from '@/components/triage/NurseAddPatientModal';

interface NurseViewProps {
  onOpenPatient: (patient: Patient) => void;
}

export function NurseView({ onOpenPatient }: NurseViewProps) {
  const { user } = useAuth();
  const { allPatients, counts } = useQueue();
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const nextPatient = allPatients[0];
  const needingTriageCount = counts.emergency + counts.high_priority;
  const nurseName = user?.first_name || 'Jordan';

  const filteredPatients = searchQuery.trim()
    ? allPatients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.mrn && p.mrn.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allPatients.slice(0, 5);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{dateStr}</div>
          <h1>Good morning, {nurseName}</h1>
          <p className="page-subtitle">Here is what needs your attention first.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="secondary-action small"
            onClick={() => setIsAddPatientOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#0f8b8d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} />
            <span>Add Patient</span>
          </button>
          {nextPatient && (
            <button className="primary-action small" onClick={() => onOpenPatient(nextPatient)}>
              Start next triage <span>→</span>
            </button>
          )}
        </div>
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
            <strong>{counts.triage_in_progress ?? 0} patients</strong>
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showSearch ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px' }}>
                <Search size={14} style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by name, MRN, complaint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{ border: 'none', outline: 'none', fontSize: '12px', width: '200px' }}
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  aria-label="Close search"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button className="filter-button" onClick={() => setShowSearch(true)}>
                <Search size={16} /> Search
              </button>
            )}
          </div>
        </div>
        <div className="nurse-list">
          {filteredPatients.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No patients match &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredPatients.map((p, idx) => (
              <div className="nurse-patient" key={p.id ? `patient-${p.id}` : p.mrn ? `mrn-${p.mrn}` : `${p.name}-${idx}`}>
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
            ))
          )}
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

      <NurseAddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={(created) => {
          // Optional callback
        }}
      />
    </>
  );
}
