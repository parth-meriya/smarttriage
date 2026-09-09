'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock3, Stethoscope, HeartPulse, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQueue } from '@/hooks/useQueue';
import { triageApi } from '@/lib/api/services';

export function PatientMyVisitView() {
  const { user } = useAuth();
  const { allPatients } = useQueue();
  const [patientRecord, setPatientRecord] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    triageApi.getMyPatientProfile().then(p => {
      if (!cancelled && p) {
        setPatientRecord(p);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const patient = patientRecord || allPatients.find(p => p.name.toLowerCase().includes('jamie')) || allPatients[3] || allPatients[0];
  const vitals = patientRecord?.latest_vitals;

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Patient Visit Summary</div>
          <h1>My Emergency Visit Details</h1>
          <p className="page-subtitle">Track your current care steps, recorded vitals, and physician instructions.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Timeline */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>Visit Journey</h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>1. Check-In & Reception</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Completed · Checked in at 10:15 AM (Ticket #4)</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>2. Nursing Triage Assessment</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Completed by Jordan Lee, RN · Vitals checked (BP: 128/82, HR: 76 bpm)</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#155eef', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Clock3 size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#155eef' }}>3. Physician Examination</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Next in queue · Assigned to Exam Room 1 with Dr. Alex Rivera</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', opacity: 0.6 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <FileText size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#334155' }}>4. Treatment & Discharge Plan</strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Prescriptions and home recovery instructions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Info */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HeartPulse size={16} color="#0f8b8d" />
              Recorded Vital Signs
            </h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Blood Pressure</span>
                <strong>{vitals?.bp_display || (vitals?.systolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg` : '128/82 mmHg')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Heart Rate</span>
                <strong>{vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '76 bpm (Normal)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Oxygen Saturation</span>
                <strong>{vitals?.spo2 ? `${vitals.spo2}% on Room Air` : '98% on Room Air'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Temperature</span>
                <strong>{vitals?.temperature ? `${vitals.temperature}°C` : '36.8°C'}</strong>
              </div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', color: '#1e3a8a', fontSize: '12px' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Need assistance right now?</strong>
            Please notify the nearest triage nurse if you experience sudden worsening of symptoms or shortness of breath.
          </div>
        </div>
      </div>
    </div>
  );
}
