'use client';

import React, { useState } from 'react';
import { UserRound, Stethoscope, Shield, CheckCircle2, Clock3, Phone, Mail } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: 'Physician' | 'Triage Nurse' | 'Charge Nurse' | 'Admin Staff';
  department: string;
  room: string;
  status: 'On Duty' | 'In Consultation' | 'On Break';
  patientsAssigned: number;
  phone: string;
}

const STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'STF-101',
    name: 'Dr. Alex Rivera, MD',
    role: 'Physician',
    department: 'Emergency Medicine',
    room: 'Exam Room 1',
    status: 'In Consultation',
    patientsAssigned: 4,
    phone: '+1 (555) 234-5678'
  },
  {
    id: 'STF-102',
    name: 'Dr. Elena Rostova, MD',
    role: 'Physician',
    department: 'Trauma Surgery',
    room: 'Trauma Bay A',
    status: 'On Duty',
    patientsAssigned: 2,
    phone: '+1 (555) 345-6789'
  },
  {
    id: 'STF-201',
    name: 'Jordan Lee, RN',
    role: 'Triage Nurse',
    department: 'Emergency Triage',
    room: 'Triage Desk 1',
    status: 'On Duty',
    patientsAssigned: 6,
    phone: '+1 (555) 456-7890'
  },
  {
    id: 'STF-202',
    name: 'Marcus Vance, BSN',
    role: 'Charge Nurse',
    department: 'Emergency Medicine',
    room: 'Central Nursing Hub',
    status: 'On Duty',
    patientsAssigned: 8,
    phone: '+1 (555) 567-8901'
  },
  {
    id: 'STF-301',
    name: 'Sam Morgan',
    role: 'Admin Staff',
    department: 'Operations & Triage',
    room: 'Admin Suite 2',
    status: 'On Duty',
    patientsAssigned: 0,
    phone: '+1 (555) 678-9012'
  }
];

export function StaffRosterView() {
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = STAFF_MEMBERS.filter(
    (s) => roleFilter === 'ALL' || s.role === roleFilter
  );

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Workforce Management</div>
          <h1>Clinical Staff Roster</h1>
          <p className="page-subtitle">On-duty clinicians, nursing staff, room allocations, and patient workloads.</p>
        </div>
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          5 Clinicians On Duty
        </div>
      </div>

      {/* Role filter buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['ALL', 'Physician', 'Triage Nurse', 'Charge Nurse', 'Admin Staff'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            style={{
              border: '1px solid',
              borderColor: roleFilter === r ? '#155eef' : '#e2e8f0',
              background: roleFilter === r ? '#eff6ff' : '#fff',
              color: roleFilter === r ? '#155eef' : '#475569',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: roleFilter === r ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map((staff) => (
          <div
            key={staff.id}
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#155eef',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px'
                }}>
                  {staff.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{staff.name}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{staff.role}</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: staff.status === 'On Duty' ? '#dcfce7' : '#fef3c7',
                color: staff.status === 'On Duty' ? '#15803d' : '#b45309'
              }}>
                {staff.status}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', display: 'grid', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div>Department: <strong>{staff.department}</strong></div>
              <div>Station / Room: <strong>{staff.room}</strong></div>
              <div>Active Patient Load: <strong style={{ color: '#155eef' }}>{staff.patientsAssigned} patients</strong></div>
              <div>Contact: <strong>{staff.phone}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
