'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, Clock3, HeartPulse, ShieldCheck, UserRound, Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyQueue } from '@/hooks/useMyQueue';
import { triageApi } from '@/lib/api/services';

export function PatientMyVisitView() {
  const { user } = useAuth();
  const { queueStatus } = useMyQueue();
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [vitals, setVitals] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    triageApi.getMyPatientProfile().then((p) => {
      if (!cancelled && p) {
        setPatientRecord(p);
        if (p.latest_vitals) setVitals(p.latest_vitals);
        if (p.active_assessment) setAssessment(p.active_assessment);
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (!patientRecord?.id) return;
    triageApi.getConsultations(patientRecord.id).then((c) => {
      if (!cancelled && Array.isArray(c)) setConsultations(c);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [patientRecord?.id]);

  const completedConsultation = consultations.find((c) => c.completed_at) || consultations[0];
  const hasConsultation = consultations.length > 0 || queueStatus?.status === 'In consultation';

  const fullName = patientRecord?.name || user?.display_name || 'You';
  const mrn = patientRecord?.mrn || queueStatus?.ticket_number || '—';

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
        {/* Visit journey timeline - built from real backend state */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>Visit Journey</h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Step 1: Check-in - completed once a queue ticket exists */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>1. Check-In &amp; Reception</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  {queueStatus?.arrived_at
                    ? `Completed · Checked in at ${new Date(queueStatus.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Ticket ${queueStatus.ticket_number})`
                    : `Registered (MRN ${mrn})`}
                </p>
              </div>
            </div>

            {/* Step 2: Nurse triage assessment */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                background: assessment ? '#dcfce7' : '#eff6ff', color: assessment ? '#16a34a' : '#155eef',
              }}>
                {assessment ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>2. Nursing Triage Assessment</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  {assessment
                    ? `Completed · Priority Level ${assessment.priority} assigned`
                    : queueStatus?.status === 'Triage in progress'
                    ? 'In progress · Nurse is assessing you now'
                    : 'Waiting for nurse assessment · vitals will be recorded here'}
                </p>
              </div>
            </div>

            {/* Step 3: Physician examination */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', opacity: hasConsultation || queueStatus?.status === 'In consultation' ? 1 : undefined }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                background: completedConsultation ? '#dcfce7' : hasConsultation ? '#eff6ff' : '#f1f5f9',
                color: completedConsultation ? '#16a34a' : hasConsultation ? '#155eef' : '#94a3b8',
              }}>
                {completedConsultation ? <CheckCircle2 size={18} /> : <Stethoscope size={18} />}
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>3. Physician Examination</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  {queueStatus?.status === 'In consultation'
                    ? 'In progress · You are currently with the doctor'
                    : completedConsultation
                    ? `Completed · Disposition: ${completedConsultation.disposition || 'Recorded'}`
                    : queueStatus && queueStatus.queue_position > 0
                    ? `Waiting in queue · Position #${queueStatus.queue_position} (${queueStatus.patients_ahead} before you)`
                    : 'Waiting in queue'}
                </p>
              </div>
            </div>

            {/* Step 4: Treatment & discharge */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', opacity: completedConsultation ? 1 : 0.6 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                background: completedConsultation ? '#dcfce7' : '#f1f5f9', color: completedConsultation ? '#16a34a' : '#94a3b8',
              }}>
                <FileText size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#334155' }}>4. Treatment &amp; Discharge Plan</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  {completedConsultation
                    ? completedConsultation.treatment_plan || completedConsultation.diagnosis || 'Plan recorded by your physician'
                    : 'Prescriptions and home recovery instructions appear here after your consultation'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Side info */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HeartPulse size={16} color="#0f8b8d" />
              Recorded Vital Signs
            </h3>
            {vitals ? (
              <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span>Blood Pressure</span>
                  <strong>{vitals.bp_display || (vitals.systolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg` : '—')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span>Heart Rate</span>
                  <strong>{vitals.heart_rate ? `${vitals.heart_rate} bpm` : '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span>Oxygen Saturation</span>
                  <strong>{vitals.spo2 ? `${vitals.spo2}%` : '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Temperature</span>
                  <strong>{vitals.temperature ? `${vitals.temperature}°C` : '—'}</strong>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                {isLoading ? 'Loading vitals…' : 'Vitals appear here after your nurse assessment.'}
              </p>
            )}
          </div>

          {assessment?.clinical_notes && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserRound size={16} color="#155eef" />
                Assessment Notes
              </h3>
              <p style={{ fontSize: '12px', color: '#475569' }}>{assessment.clinical_notes}</p>
            </div>
          )}

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', color: '#1e3a8a', fontSize: '12px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <ShieldCheck size={14} /> Need assistance right now?
            </strong>
            Please notify the nearest triage nurse if you experience sudden worsening of symptoms or shortness of breath.
          </div>
        </div>
      </div>
    </div>
  );
}
