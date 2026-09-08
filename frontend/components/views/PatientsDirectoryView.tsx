'use client';

import React, { useState } from 'react';
import { Search, Users, FileText, ChevronRight, Activity, Calendar, Phone } from 'lucide-react';
import { Role, Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useQueue } from '@/hooks/useQueue';

interface PatientsDirectoryViewProps {
  role: Role;
  onOpenPatient: (patient: Patient) => void;
}

export function PatientsDirectoryView({ role, onOpenPatient }: PatientsDirectoryViewProps) {
  const { allPatients } = useQueue();
  const [search, setSearch] = useState('');

  const filtered = allPatients.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.complaint.toLowerCase().includes(search.toLowerCase()) ||
      (p.mrn && p.mrn.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Electronic Health Records</div>
          <h1>Patient Directory</h1>
          <p className="page-subtitle">Master roster of all registered and admitted emergency patients.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            {allPatients.length} Active Records
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Search size={18} style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Filter directory by patient name, MRN, or symptoms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '14px',
            background: 'transparent'
          }}
        />
      </div>

      {/* Patient Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px'
      }}>
        {filtered.map((patient, idx) => {
          const initials = patient.initials || patient.name.slice(0, 2).toUpperCase();
          const vitals = patient.vitals;

          return (
            <div
              key={patient.id || patient.mrn || idx}
              onClick={() => onOpenPatient(patient)}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#155eef')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
                      {initials}
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{patient.name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        MRN: {patient.mrn || 'ST-2048'} · {patient.age ? `${patient.age} yrs` : ''} {patient.gender || ''}
                      </span>
                    </div>
                  </div>
                  <PriorityBadge priority={patient.priority} />
                </div>

                <div style={{
                  background: '#f8fafc',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '14px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '2px' }}>
                    Chief Complaint
                  </div>
                  <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                    {patient.complaint}
                  </div>
                </div>

                {vitals && (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '11px',
                    color: '#475569',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '10px',
                    marginBottom: '12px'
                  }}>
                    {vitals.bp && <span>BP: <strong>{vitals.bp}</strong></span>}
                    {vitals.hr && <span>HR: <strong>{vitals.hr} bpm</strong></span>}
                    {vitals.spo2 && <span>SpO2: <strong>{vitals.spo2}%</strong></span>}
                    {vitals.temp && <span>Temp: <strong>{vitals.temp}°F</strong></span>}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: '12px',
                marginTop: '6px'
              }}>
                <StatusBadge status={patient.status || 'Waiting'} />
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#155eef',
                    fontWeight: 600,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span>{role === 'Nurse' ? 'Triage Workflow' : 'Clinical Chart'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
