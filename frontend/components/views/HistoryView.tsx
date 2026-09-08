'use client';

import React, { useState } from 'react';
import { History, Search, Calendar, FileCheck, CheckCircle2, User, Download, Stethoscope } from 'lucide-react';
import { Role } from '@/types/triage';

interface HistoryViewProps {
  role: Role;
}

interface CompletedRecord {
  id: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  complaint: string;
  acuity: string;
  attendingDoctor: string;
  triageNurse: string;
  disposition: 'Discharged Home' | 'Admitted to Ward' | 'Transferred' | 'Observation';
  completedAt: string;
  notes: string;
}

const DEMO_COMPLETED_RECORDS: CompletedRecord[] = [
  {
    id: 'ENC-9012',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-78401',
    age: 45,
    gender: 'Female',
    complaint: 'Acute migraine with visual aura',
    acuity: 'Level 3 - Urgent',
    attendingDoctor: 'Dr. Alex Rivera',
    triageNurse: 'Jordan Lee, RN',
    disposition: 'Discharged Home',
    completedAt: 'Today, 09:30 AM',
    notes: 'Administered IV magnesium and antiemetics. Symptoms resolved. Discharged with outpatient neurology follow-up.'
  },
  {
    id: 'ENC-9011',
    patientName: 'David Chen',
    mrn: 'MRN-65219',
    age: 58,
    gender: 'Male',
    complaint: 'Right lower quadrant abdominal pain',
    acuity: 'Level 2 - High Priority',
    attendingDoctor: 'Dr. Alex Rivera',
    triageNurse: 'Jordan Lee, RN',
    disposition: 'Admitted to Ward',
    completedAt: 'Today, 08:45 AM',
    notes: 'CT abdomen confirmed acute appendicitis. Surgical consult completed; admitted to General Surgery service.'
  },
  {
    id: 'ENC-9010',
    patientName: 'Sarah Jenkins',
    mrn: 'MRN-43092',
    age: 29,
    gender: 'Female',
    complaint: 'Distal radius fracture right wrist',
    acuity: 'Level 4 - Non-urgent',
    attendingDoctor: 'Dr. Alex Rivera',
    triageNurse: 'Jordan Lee, RN',
    disposition: 'Discharged Home',
    completedAt: 'Yesterday, 11:15 PM',
    notes: 'Closed reduction performed under hematoma block. Splint placed. Orthopedic clinic appointment scheduled in 5 days.'
  },
  {
    id: 'ENC-9009',
    patientName: 'Marcus Bell',
    mrn: 'MRN-88124',
    age: 67,
    gender: 'Male',
    complaint: 'COPD exacerbation with wheezing',
    acuity: 'Level 2 - High Priority',
    attendingDoctor: 'Dr. Alex Rivera',
    triageNurse: 'Jordan Lee, RN',
    disposition: 'Observation',
    completedAt: 'Yesterday, 07:20 PM',
    notes: 'Nebulized bronchodilators and oral steroids started. Oxygen saturation stabilized to 94% on room air.'
  },
  {
    id: 'ENC-9008',
    patientName: 'Hannah Patel',
    mrn: 'MRN-55104',
    age: 22,
    gender: 'Female',
    complaint: 'Superficial forearm laceration',
    acuity: 'Level 5 - Non-urgent',
    attendingDoctor: 'Dr. Alex Rivera',
    triageNurse: 'Jordan Lee, RN',
    disposition: 'Discharged Home',
    completedAt: 'Yesterday, 04:10 PM',
    notes: 'Irrigated and sutured with 4-0 Ethilon (4 simple interrupted sutures). Tetanus booster given.'
  }
];

export function HistoryView({ role }: HistoryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState('ALL');

  const filtered = DEMO_COMPLETED_RECORDS.filter((rec) => {
    const matchesSearch =
      !search.trim() ||
      rec.patientName.toLowerCase().includes(search.toLowerCase()) ||
      rec.mrn.toLowerCase().includes(search.toLowerCase()) ||
      rec.complaint.toLowerCase().includes(search.toLowerCase());

    const matchesDisp =
      selectedDisposition === 'ALL' || rec.disposition === selectedDisposition;

    return matchesSearch && matchesDisp;
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Clinical Encounter Logs</div>
          <h1>Clinical History & Discharges</h1>
          <p className="page-subtitle">Past emergency department encounters, triage logs, and patient dispositions.</p>
        </div>
        <button className="availability" style={{ cursor: 'pointer' }}>
          <Download size={15} /> Export Audit Log
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '6px 12px',
          minWidth: '260px'
        }}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search encounter history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Disposition:</span>
          {['ALL', 'Discharged Home', 'Admitted to Ward', 'Observation'].map((disp) => (
            <button
              key={disp}
              onClick={() => setSelectedDisposition(disp)}
              style={{
                border: '1px solid',
                borderColor: selectedDisposition === disp ? '#155eef' : '#e2e8f0',
                background: selectedDisposition === disp ? '#eff6ff' : '#fff',
                color: selectedDisposition === disp ? '#155eef' : '#475569',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: selectedDisposition === disp ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {disp}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filtered.map((record) => (
          <div
            key={record.id}
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>{record.patientName}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>({record.mrn})</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: record.disposition === 'Admitted to Ward' ? '#fef3c7' : '#dcfce7',
                    color: record.disposition === 'Admitted to Ward' ? '#b45309' : '#15803d'
                  }}>
                    {record.disposition}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {record.age}y {record.gender} · Chief Complaint: <span style={{ color: '#1e293b', fontWeight: 600 }}>{record.complaint}</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
                <div>Completed: <strong style={{ color: '#475569' }}>{record.completedAt}</strong></div>
                <div>ID: {record.id}</div>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#334155',
              lineHeight: '1.5',
              border: '1px solid #f1f5f9'
            }}>
              <strong>Clinical Note: </strong>{record.notes}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', paddingTop: '6px' }}>
              <span>Attending: <strong>{record.attendingDoctor}</strong> · Nurse: <strong>{record.triageNurse}</strong></span>
              <span style={{ color: '#155eef', fontWeight: 600 }}>{record.acuity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
