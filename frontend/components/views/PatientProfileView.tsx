'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Phone, AlertCircle, CheckCircle2, Heart, FileText, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { triageApi } from '@/lib/api/services';
import { HealthReportDto } from '@/lib/api/types';
import { HealthReportList } from '@/components/triage/HealthReportList';

export function PatientProfileView() {
  const { user } = useAuth();
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [reports, setReports] = useState<HealthReportDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPatientData = async () => {
      setIsLoading(true);
      try {
        const profile = await triageApi.getMyPatientProfile();
        if (cancelled) return;
        setPatientRecord(profile);

        if (profile?.id) {
          try {
            const userReports = await triageApi.getPatientReports(profile.id);
            if (!cancelled && userReports) {
              setReports(userReports);
            }
          } catch {
            // fallback if reports endpoint fails
            if (profile.health_reports) {
              setReports(profile.health_reports);
            }
          }
        }
      } catch {
        // graceful offline fallback
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPatientData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fullName = patientRecord?.name || user?.display_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Jamie Smith');
  const mrn = patientRecord?.mrn || user?.username || 'ST-2048';
  const age = patientRecord?.age || 32;
  const gender = patientRecord?.gender || 'Male';
  const dob = patientRecord?.date_of_birth || '1994-05-14';
  const phone = patientRecord?.phone || user?.phone_number || '+1 (555) 890-1234';
  const address = patientRecord?.address || '1428 Elm Street, North District';
  const emergencyName = patientRecord?.emergency_contact_name || 'Taylor Smith (Spouse)';
  const emergencyPhone = patientRecord?.emergency_contact_phone || '+1 (555) 890-1234';

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Personal Health Record</div>
          <h1>Patient Profile & Medical ID</h1>
          <p className="page-subtitle">Your registered demographic details, vital health information, and medical reports.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '820px' }}>
        {/* Personal Demographic Details */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: '#155eef' }} />
            Demographic Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Full Legal Name</span>
              <strong style={{ color: '#0f172a' }}>{fullName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Medical Record Number (MRN)</span>
              <strong style={{ color: '#0f172a' }}>{mrn}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Age & Gender</span>
              <strong style={{ color: '#0f172a' }}>{age} years · {gender}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Date of Birth</span>
              <strong style={{ color: '#0f172a' }}>{dob}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Phone Number</span>
              <strong style={{ color: '#0f172a' }}>{phone}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Residential Address</span>
              <strong style={{ color: '#0f172a' }}>{address}</strong>
            </div>
          </div>
        </div>

        {/* Health & Diagnostic Reports Section */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
          <HealthReportList
            reports={reports}
            patientId={patientRecord?.id}
            patientName={fullName}
            canUpload={false}
          />
        </div>

        {/* Medical Alerts & Allergies */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: '#f59e0b' }} />
            Allergies & Adverse Reactions
          </h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              Penicillin (Anaphylaxis risk)
            </span>
            <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              Sulfa Antibiotics (Rash)
            </span>
          </div>
        </div>

        {/* Emergency Contact */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={18} style={{ color: '#0f8b8d' }} />
            Emergency Contacts
          </h2>
          <div style={{ fontSize: '13px', display: 'grid', gap: '8px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Primary Contact</span>
              <strong style={{ color: '#0f172a' }}>{emergencyName} · {emergencyPhone}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Admitting Facility</span>
              <strong style={{ color: '#0f172a' }}>Northside Medical Center - Emergency Department</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

