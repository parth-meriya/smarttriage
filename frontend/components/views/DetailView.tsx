'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock3, FileText, HeartPulse, History, CheckCircle2, Loader2 } from 'lucide-react';
import { Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Assistant } from '@/components/ai/Assistant';
import { triageApi } from '@/lib/api/services';
import { TriageAssessmentDto, VitalSignDto, ConsultationDto } from '@/lib/api/types';

interface DetailViewProps {
  patient?: Patient;
  onBack: () => void;
}

export function DetailView({ patient, onBack }: DetailViewProps) {
  if (!patient) {
    return (
      <>
        <button className="back-link" onClick={onBack}>← Back to command center</button>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          <p>No patient selected. Please select a patient from the queue.</p>
        </div>
      </>
    );
  }

  const p = patient;
  const patientId = p.patientId || p.id;

  const [status, setStatus] = useState<string>(p.status || 'Waiting');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationDto | null>(null);

  // Real clinical data from backend
  const [latestVitals, setLatestVitals] = useState<VitalSignDto | null>(null);
  const [triageAssessment, setTriageAssessment] = useState<TriageAssessmentDto | null>(null);
  const [pastVisits, setPastVisits] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Consultation form state
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [consultationData, setConsultationData] = useState({
    clinical_findings: '',
    diagnosis: '',
    treatment_plan: '',
    disposition: 'Discharged' as string,
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [consultationCompleted, setConsultationCompleted] = useState(false);

  // Fetch real patient data on mount
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const history = await triageApi.getPatientHistoryTyped(patientId);
        if (cancelled) return;

        if (history.vitals && history.vitals.length > 0) {
          setLatestVitals(history.vitals[0]);
        }
        if (history.triage_history && history.triage_history.length > 0) {
          setTriageAssessment(history.triage_history[0]);
        }
        if (history.visits) {
          setPastVisits(history.visits);
        }
      } catch {
        // Graceful fallback — use data from the Patient prop
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [patientId]);

  const handleStartConsultation = async () => {
    setIsCalling(true);
    try {
      // 1. Call patient (transition queue ticket)
      if (p.id) {
        await triageApi.callPatient(p.id);
      }
      // 2. Create a consultation record
      if (patientId) {
        const consultation = await triageApi.createConsultation({
          patient: patientId,
          chief_complaint: p.complaint,
        });
        setActiveConsultation(consultation);
      }
      setStatus('In consultation');
    } catch {
      // Graceful offline fallback
      setStatus('In consultation');
    } finally {
      setIsCalling(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!activeConsultation?.id) return;
    setIsCompleting(true);
    try {
      await triageApi.completeConsultation(activeConsultation.id, consultationData);
      // Also complete the queue ticket
      if (p.id) {
        await triageApi.completeTicket(p.id);
      }
      setConsultationCompleted(true);
    } catch {
      // Show error state
    } finally {
      setIsCompleting(false);
    }
  };

  // Use real vitals from backend if available, otherwise fall back to Patient prop
  const spo2 = latestVitals?.spo2 ?? p.spo2;
  const heartRate = latestVitals?.heart_rate ?? p.heartRate;
  const respiratoryRate = latestVitals?.respiratory_rate ?? p.respiratoryRate;
  const systolicBp = latestVitals?.systolic_bp;
  const diastolicBp = latestVitals?.diastolic_bp;
  const temperature = latestVitals?.temperature;

  const isHypoxic = spo2 !== undefined ? spo2 < 90 : p.priority === 1;
  const isTachycardic = heartRate !== undefined ? heartRate > 100 : false;
  const isTachypneic = respiratoryRate !== undefined ? respiratoryRate > 20 : false;

  // Build real timeline from data
  const timelineEvents: [string, string][] = [];
  if (consultationCompleted) {
    timelineEvents.push(['Just now', 'Consultation completed']);
  }
  if (status === 'In consultation') {
    timelineEvents.push(['Just now', 'Consultation started']);
  }
  if (triageAssessment?.created_at) {
    const t = new Date(triageAssessment.created_at);
    timelineEvents.push([t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'Triage completed']);
  }
  if (latestVitals?.recorded_at) {
    const t = new Date(latestVitals.recorded_at);
    timelineEvents.push([t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'Vitals recorded']);
  }
  timelineEvents.push([
    p.registeredAt
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Earlier',
    'Patient registered',
  ]);

  if (consultationCompleted) {
    return (
      <>
        <button className="back-link" onClick={onBack}>← Back to command center</button>
        <div className="detail-header">
          <div className="patient-person">
            <div className="avatar patient-avatar large">{p.initials}</div>
            <div>
              <div className="eyebrow">Consultation completed · {p.mrn || 'ST-XXXX'}</div>
              <h1>{p.name}</h1>
              <p>{p.age} years · {p.gender || 'Unknown'}</p>
            </div>
          </div>
          <div className="detail-actions">
            <PriorityBadge level={p.priority} />
          </div>
        </div>
        <section className="clinical-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="card-title">
            <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
            <h2>Consultation completed</h2>
          </div>
          <div style={{ marginTop: '12px' }}>
            {consultationData.diagnosis && (
              <div className="answer-row">
                <span>Diagnosis</span>
                <strong>{consultationData.diagnosis}</strong>
              </div>
            )}
            {consultationData.treatment_plan && (
              <div className="answer-row">
                <span>Treatment plan</span>
                <strong>{consultationData.treatment_plan}</strong>
              </div>
            )}
            <div className="answer-row">
              <span>Disposition</span>
              <strong>{consultationData.disposition}</strong>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button className="primary-action small" onClick={onBack}>
              Return to command center <span>→</span>
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← Back to command center
      </button>

      <div className="detail-header">
        <div className="patient-person">
          <div className="avatar patient-avatar large">{p.initials}</div>
          <div>
            <div className="eyebrow">Patient record · {p.mrn || 'ST-XXXX'}</div>
            <h1>{p.name}</h1>
            <p>
              {p.age} years · {p.gender || 'Male'} · {p.registeredAt || 'Registered today'}
            </p>
          </div>
        </div>
        <div className="detail-actions">
          <PriorityBadge level={p.priority} />
          <button
            className="primary-action"
            onClick={handleStartConsultation}
            disabled={isCalling || status === 'In consultation'}
            style={status === 'In consultation' ? { background: '#16a34a', borderColor: '#16a34a' } : undefined}
          >
            {isCalling ? (
              'Starting...'
            ) : status === 'In consultation' ? (
              <>
                <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> In consultation
              </>
            ) : (
              <>
                Start consultation <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <main>
          <section className={`clinical-card ${p.priority === 1 ? 'critical-card' : ''}`}>
            <div className="card-title">
              <AlertCircle size={18} />
              <h2>Immediate concern</h2>
            </div>
            <h3>{p.complaint}</h3>
            <p>
              {status === 'In consultation'
                ? 'Consultation is in progress.'
                : 'Patient is waiting for prompt clinical assessment.'}
            </p>
            <div className="detail-vitals">
              <div>
                <span>SpO₂</span>
                <strong className={isHypoxic ? 'critical-text' : ''}>
                  {spo2 !== undefined ? `${spo2}%` : '—'}
                </strong>
                <small className={isHypoxic ? 'critical-text' : ''}>
                  {spo2 !== undefined ? (isHypoxic ? 'Needs attention' : 'Normal') : 'Not recorded'}
                </small>
              </div>
              <div>
                <span>Heart rate</span>
                <strong>
                  {heartRate !== undefined ? heartRate : '—'}{heartRate !== undefined ? <em> bpm</em> : ''}
                </strong>
                <small className={isTachycardic ? 'critical-text' : ''}>
                  {heartRate !== undefined ? (isTachycardic ? 'Elevated' : 'Normal') : 'Not recorded'}
                </small>
              </div>
              <div>
                <span>Respiratory rate</span>
                <strong>
                  {respiratoryRate !== undefined ? respiratoryRate : '—'}{respiratoryRate !== undefined ? <em> /min</em> : ''}
                </strong>
                <small className={isTachypneic ? 'critical-text' : ''}>
                  {respiratoryRate !== undefined ? (isTachypneic ? 'Elevated' : 'Normal') : 'Not recorded'}
                </small>
              </div>
            </div>
            {(systolicBp || diastolicBp || temperature) && (
              <div className="detail-vitals" style={{ borderTop: '1px solid var(--border)', marginTop: '0' }}>
                {(systolicBp && diastolicBp) && (
                  <div>
                    <span>Blood pressure</span>
                    <strong>{systolicBp}/{diastolicBp} <em>mmHg</em></strong>
                    <small className={systolicBp >= 180 ? 'critical-text' : ''}>
                      {systolicBp >= 180 ? 'Critical' : systolicBp >= 140 ? 'Elevated' : 'Normal'}
                    </small>
                  </div>
                )}
                {temperature && (
                  <div>
                    <span>Temperature</span>
                    <strong>{String(temperature)} <em>°C</em></strong>
                    <small className={Number(temperature) >= 38.0 ? 'critical-text' : ''}>
                      {Number(temperature) >= 38.0 ? 'Febrile' : 'Normal'}
                    </small>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="clinical-card">
            <div className="card-title">
              <HeartPulse size={18} />
              <h2>Triage responses</h2>
            </div>
            {isLoadingData ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: '6px' }} />
                Loading triage data...
              </div>
            ) : triageAssessment ? (
              <>
                <div className="answer-row">
                  <span>Primary complaint</span>
                  <strong>{triageAssessment.primary_complaint}</strong>
                </div>
                <div className="answer-row">
                  <span>Severe breathing difficulty?</span>
                  <strong style={triageAssessment.severe_breathing_difficulty ? { color: 'var(--red)' } : undefined}>
                    {triageAssessment.severe_breathing_difficulty ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div className="answer-row">
                  <span>Chest pain or pressure?</span>
                  <strong style={triageAssessment.chest_pain_or_pressure ? { color: 'var(--red)' } : undefined}>
                    {triageAssessment.chest_pain_or_pressure ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div className="answer-row">
                  <span>Slurred speech or weakness?</span>
                  <strong style={triageAssessment.slurred_speech_or_weakness ? { color: 'var(--red)' } : undefined}>
                    {triageAssessment.slurred_speech_or_weakness ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div className="answer-row">
                  <span>Symptoms started</span>
                  <strong>{triageAssessment.symptom_onset}</strong>
                </div>
                {triageAssessment.clinical_notes && (
                  <div className="answer-row">
                    <span>Clinical notes</span>
                    <strong>{triageAssessment.clinical_notes}</strong>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '12px', color: '#78838e', fontSize: '12px' }}>
                No triage assessment recorded yet.
              </div>
            )}
          </section>

          {/* Consultation Form — shown when consultation is active */}
          {status === 'In consultation' && !consultationCompleted && (
            <section className="clinical-card" style={{ borderLeft: '4px solid var(--teal)' }}>
              <div className="card-title">
                <FileText size={18} />
                <h2>Consultation notes</h2>
              </div>
              <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                  Clinical findings
                  <textarea
                    value={consultationData.clinical_findings}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, clinical_findings: e.target.value })
                    }
                    placeholder="Document clinical observations and examination findings"
                    rows={3}
                    style={{
                      fontSize: '13px', padding: '9px 11px', borderRadius: '5px',
                      border: '1px solid var(--border)', fontWeight: 400, resize: 'vertical', fontFamily: 'inherit',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                  Diagnosis
                  <input
                    type="text"
                    value={consultationData.diagnosis}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, diagnosis: e.target.value })
                    }
                    placeholder="Primary diagnosis"
                    style={{
                      fontSize: '13px', padding: '9px 11px', borderRadius: '5px',
                      border: '1px solid var(--border)', fontWeight: 400,
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                  Treatment plan
                  <textarea
                    value={consultationData.treatment_plan}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, treatment_plan: e.target.value })
                    }
                    placeholder="Medications, procedures, follow-up instructions"
                    rows={3}
                    style={{
                      fontSize: '13px', padding: '9px 11px', borderRadius: '5px',
                      border: '1px solid var(--border)', fontWeight: 400, resize: 'vertical', fontFamily: 'inherit',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                  Disposition
                  <select
                    value={consultationData.disposition}
                    onChange={(e) =>
                      setConsultationData({ ...consultationData, disposition: e.target.value })
                    }
                    style={{
                      fontSize: '13px', padding: '9px 11px', borderRadius: '5px',
                      border: '1px solid var(--border)', fontWeight: 400, background: '#fff',
                    }}
                  >
                    <option value="Discharged">Discharged home</option>
                    <option value="Admitted">Admitted to inpatient ward</option>
                    <option value="Observation">Extended clinical observation</option>
                    <option value="Transferred">Transferred to tertiary facility</option>
                  </select>
                </label>
                <button
                  className="primary-action small"
                  onClick={handleCompleteConsultation}
                  disabled={isCompleting}
                  style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Complete consultation
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          <section className="clinical-card">
            <div className="card-title">
              <History size={18} />
              <h2>Patient history</h2>
            </div>
            {pastVisits.length > 0 ? (
              pastVisits.slice(0, 5).map((visit: any, idx: number) => (
                <div className="answer-row" key={visit.id || idx}>
                  <span>{visit.status || 'Visit'}</span>
                  <strong>{visit.complaint || visit.chief_complaint || 'No details'}</strong>
                </div>
              ))
            ) : (
              <div className="empty-record">
                <FileText size={19} />
                <div>
                  <strong>No previous records available</strong>
                  <p>No previous visits or consultations are available for this patient.</p>
                </div>
              </div>
            )}
          </section>
        </main>

        <aside>
          <Assistant patient={p} />
          <section className="clinical-card timeline">
            <div className="card-title">
              <Clock3 size={18} />
              <h2>Visit timeline</h2>
            </div>
            {timelineEvents.map((x, idx) => (
              <div className="timeline-row" key={`${x[1]}-${idx}`}>
                <span>{x[0]}</span>
                <strong>{x[1]}</strong>
              </div>
            ))}
          </section>
          {/* Export full health report */}
          <button
            className="primary-action small"
            onClick={() => {
              const report = {
                patient: p,
                vitals: latestVitals,
                triageAssessment,
                pastVisits,
                consultation: consultationCompleted ? consultationData : null,
              };
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${p.name.replace(/\s+/g, '_')}_health_report.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ marginTop: '12px' }}
          >
            Download full health report
          </button>
        </aside>
      </div>
    </>
  );
}
