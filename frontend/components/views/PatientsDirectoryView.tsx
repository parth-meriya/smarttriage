'use client';

import React, { useState, useEffect } from 'react';
import { Search, Users, FileText, ChevronRight, Activity, Calendar, Phone, UserPlus, HeartPulse, ShieldAlert, MapPin, User } from 'lucide-react';
import { Role, Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useQueue } from '@/hooks/useQueue';
import { triageApi } from '@/lib/api/services';
import { NurseAddPatientModal } from '@/components/triage/NurseAddPatientModal';

interface PatientsDirectoryViewProps {
  role: Role;
  onOpenPatient: (patient: Patient) => void;
}

export function PatientsDirectoryView({ role, onOpenPatient }: PatientsDirectoryViewProps) {
  const { allPatients: queuePatients, refetch } = useQueue();
  const [dbPatients, setDbPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllPatients = async () => {
    setIsLoading(true);
    try {
      const resp: any = await triageApi.getPatients();
      const list = Array.isArray(resp) ? resp : resp?.results || [];
      const mapped: Patient[] = list.map((p: any) => {
        const v = p.latest_vitals;
        const a = p.active_assessment;
        return {
          id: p.id,
          patientId: p.id,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Patient',
          initials: p.initials || `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase() || 'PT',
          age: p.age || 30,
          gender: p.gender || 'Male',
          mrn: p.mrn || `ST-${p.id}`,
          complaint: a?.primary_complaint || 'General Emergency Intake',
          priority: (a?.priority as 1 | 2 | 3 | 4) || 4,
          wait: 'Registered',
          vital: v?.display_vital || 'Normal',
          status: a ? 'Triage complete' : 'Waiting',
          registeredAt: p.registered_at ? `Registered ${new Date(p.registered_at).toLocaleDateString()}` : undefined,
          phone: p.phone,
          address: p.address,
          emergencyContact: p.emergency_contact_name ? `${p.emergency_contact_name} (${p.emergency_contact_phone || ''})` : undefined,
          reportsCount: p.health_reports?.length || 0,
          spo2: v?.spo2,
          heartRate: v?.heart_rate,
          bloodPressure: v?.bp_display || (v?.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : undefined),
          temperature: v?.temperature,
        } as any;
      });
      setDbPatients(mapped);
    } catch {
      // fallback to queue patients
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Merge database patients with active queue tickets without duplicate MRNs/names
  const mergedPatients: Patient[] = [...dbPatients];
  const existingKeys = new Set(dbPatients.map((p) => (p.mrn || p.name).toLowerCase()));

  for (const qp of queuePatients) {
    const key = (qp.mrn || qp.name).toLowerCase();
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      mergedPatients.push(qp);
    }
  }

  const filtered = mergedPatients.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.complaint.toLowerCase().includes(search.toLowerCase()) ||
      (p.mrn && p.mrn.toLowerCase().includes(search.toLowerCase())) ||
      ((p as any).phone && (p as any).phone.includes(search))
  );

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Master Clinical Roster</div>
          <h1>All Registered Patients</h1>
          <p className="page-subtitle">Complete directory of all emergency patients, complaints, vitals, and health records.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {role !== 'Patient' && (
            <button
              type="button"
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
          )}
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            {filtered.length} Total Patients
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
          placeholder="Filter by patient name, MRN, symptom/complaint, or phone number..."
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '16px'
      }}>
        {filtered.map((patient: any, idx) => {
          const initials = patient.initials || patient.name.slice(0, 2).toUpperCase();
          const reportsCount = patient.reportsCount || 0;

          return (
            <div
              key={patient.id || patient.mrn || idx}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '14px', background: '#155eef', color: '#fff' }}>
                      {initials}
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{patient.name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        MRN: {patient.mrn || 'ST-2048'} · {patient.age} yrs · {patient.gender || 'Male'}
                      </span>
                    </div>
                  </div>
                  <PriorityBadge level={patient.priority} />
                </div>

                {/* Chief Complaint / What the patient has */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>
                    Current Concern / Complaint
                  </div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                    {patient.complaint}
                  </div>
                </div>

                {/* Salient Vitals */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#475569',
                  background: '#fcfcfd',
                  border: '1px solid #f1f5f9',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>SpO₂</span>
                    <strong style={{ color: patient.spo2 && patient.spo2 < 92 ? '#dc2626' : '#0f172a' }}>
                      {patient.spo2 ? `${patient.spo2}%` : '98%'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Heart Rate</span>
                    <strong style={{ color: patient.heartRate && patient.heartRate > 100 ? '#d97706' : '#0f172a' }}>
                      {patient.heartRate ? `${patient.heartRate} bpm` : '74 bpm'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Blood Press.</span>
                    <strong>{patient.bloodPressure || '120/80'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Temp</span>
                    <strong>{patient.temperature ? `${patient.temperature}°C` : '36.8°C'}</strong>
                  </div>
                </div>

                {/* Additional Patient info & Health Reports Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  {patient.phone ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} style={{ color: '#94a3b8' }} /> {patient.phone}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} style={{ color: '#94a3b8' }} /> Northside Campus
                    </span>
                  )}

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: reportsCount > 0 ? '#eff8ff' : '#f8fafc',
                    color: reportsCount > 0 ? '#155eef' : '#64748b',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: reportsCount > 0 ? '1px solid #d1e9ff' : '1px solid #e2e8f0'
                  }}>
                    <FileText size={12} />
                    {reportsCount > 0 ? `${reportsCount} Health Report${reportsCount > 1 ? 's' : ''}` : 'No Reports'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: '12px',
                marginTop: '4px'
              }}>
                <StatusBadge>{patient.status || 'Waiting'}</StatusBadge>
                <button
                  type="button"
                  onClick={() => onOpenPatient(patient)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#155eef',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>View Clinical Chart</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <NurseAddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => {
          setIsAddPatientOpen(false);
          fetchAllPatients();
        }}
        onPatientAdded={(created) => {
          fetchAllPatients();
          if (refetch) refetch();
          if (created) {
            onOpenPatient(created);
          }
        }}
      />
    </div>
  );
}

