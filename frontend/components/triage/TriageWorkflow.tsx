'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  ClipboardList,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { triageApi } from '@/lib/api/services';

interface TriageWorkflowProps {
  patient: Patient;
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'questions' | 'vitals' | 'review';

interface TriageFormData {
  primary_complaint: string;
  symptom_onset: string;
  severe_breathing_difficulty: boolean;
  chest_pain_or_pressure: boolean;
  slurred_speech_or_weakness: boolean;
  clinical_notes: string;
}

interface VitalsFormData {
  spo2: string;
  heart_rate: string;
  respiratory_rate: string;
  systolic_bp: string;
  diastolic_bp: string;
  temperature: string;
}

const STEP_META: Record<Step, { label: string; icon: React.ReactNode }> = {
  questions: { label: 'Intake Questions', icon: <ClipboardList size={16} /> },
  vitals: { label: 'Vital Signs', icon: <HeartPulse size={16} /> },
  review: { label: 'Review & Confirm', icon: <Eye size={16} /> },
};

const STEPS: Step[] = ['questions', 'vitals', 'review'];

export function TriageWorkflow({ patient, onComplete, onCancel }: TriageWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('questions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ priority: number; rationale: string } | null>(null);

  const [triageData, setTriageData] = useState<TriageFormData>({
    primary_complaint: patient.complaint || '',
    symptom_onset: '',
    severe_breathing_difficulty: false,
    chest_pain_or_pressure: false,
    slurred_speech_or_weakness: false,
    clinical_notes: '',
  });

  const [vitalsData, setVitalsData] = useState<VitalsFormData>({
    spo2: patient.spo2?.toString() || '',
    heart_rate: patient.heartRate?.toString() || '',
    respiratory_rate: patient.respiratoryRate?.toString() || '',
    systolic_bp: '',
    diastolic_bp: '',
    temperature: '',
  });

  const stepIndex = STEPS.indexOf(currentStep);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1]);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]);
    }
  };

  const canProceedFromQuestions =
    triageData.primary_complaint.trim().length > 0 && triageData.symptom_onset.trim().length > 0;

  const handleSubmitTriage = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Record vitals (only if at least one value is provided)
      const hasVitals = Object.values(vitalsData).some((v) => v.trim() !== '');
      if (hasVitals) {
        const vitalsPayload: Record<string, any> = {
          patient: patient.patientId || patient.id,
        };
        if (vitalsData.spo2) vitalsPayload.spo2 = parseInt(vitalsData.spo2, 10);
        if (vitalsData.heart_rate) vitalsPayload.heart_rate = parseInt(vitalsData.heart_rate, 10);
        if (vitalsData.respiratory_rate) vitalsPayload.respiratory_rate = parseInt(vitalsData.respiratory_rate, 10);
        if (vitalsData.systolic_bp) vitalsPayload.systolic_bp = parseInt(vitalsData.systolic_bp, 10);
        if (vitalsData.diastolic_bp) vitalsPayload.diastolic_bp = parseInt(vitalsData.diastolic_bp, 10);
        if (vitalsData.temperature) vitalsPayload.temperature = parseFloat(vitalsData.temperature);

        await triageApi.recordVitals(vitalsPayload as any);
      }

      // Step 2: Submit triage assessment (this triggers the backend engine)
      const assessmentPayload = {
        patient: patient.patientId || patient.id,
        primary_complaint: triageData.primary_complaint,
        symptom_onset: triageData.symptom_onset,
        severe_breathing_difficulty: triageData.severe_breathing_difficulty,
        chest_pain_or_pressure: triageData.chest_pain_or_pressure,
        slurred_speech_or_weakness: triageData.slurred_speech_or_weakness,
        clinical_notes: triageData.clinical_notes,
      };

      const res = await triageApi.submitTriage(assessmentPayload as any);

      setResult({
        priority: res.priority,
        rationale: res.ai_rationale || 'Priority assigned based on clinical evaluation of symptoms and vital signs.',
      });
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit triage assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // After successful submission, show result
  if (result) {
    return (
      <>
        <button className="back-link" onClick={onComplete}>
          ← Back to patient list
        </button>
        <div className="detail-header">
          <div className="patient-person">
            <div className="avatar patient-avatar large">{patient.initials}</div>
            <div>
              <div className="eyebrow">Triage completed · {patient.mrn || 'ST-XXXX'}</div>
              <h1>{patient.name}</h1>
              <p>{patient.age} years · {patient.gender || 'Unknown'}</p>
            </div>
          </div>
          <div className="detail-actions">
            <PriorityBadge level={result.priority as 1 | 2 | 3 | 4} />
          </div>
        </div>

        <section className="clinical-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="card-title">
            <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
            <h2>Triage assessment complete</h2>
          </div>
          <p style={{ marginTop: '8px', fontSize: '13px', color: '#4d5965', lineHeight: '1.6' }}>
            {result.rationale}
          </p>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#78838e' }}>
            Patient has been placed in the priority queue. The doctor will be notified automatically.
          </p>
          <div style={{ marginTop: '16px' }}>
            <button className="primary-action small" onClick={onComplete}>
              Return to patient list <span>→</span>
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <button className="back-link" onClick={onCancel}>
        ← Cancel triage
      </button>

      {/* Patient header */}
      <div className="detail-header">
        <div className="patient-person">
          <div className="avatar patient-avatar large">{patient.initials}</div>
          <div>
            <div className="eyebrow">Triage assessment · {patient.mrn || 'ST-XXXX'}</div>
            <h1>{patient.name}</h1>
            <p>{patient.age} years · {patient.gender || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          padding: '12px 14px',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '6px',
        }}
      >
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: 1,
              padding: '8px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: i === stepIndex ? 700 : 400,
              color: i === stepIndex ? 'var(--teal)' : i < stepIndex ? '#16a34a' : '#8b93a1',
              background: i === stepIndex ? 'var(--teal-tint)' : 'transparent',
            }}
          >
            {i < stepIndex ? <CheckCircle2 size={14} style={{ color: '#16a34a' }} /> : STEP_META[s].icon}
            {STEP_META[s].label}
          </div>
        ))}
      </div>

      {/* Step content */}
      <section className="clinical-card" style={{ marginBottom: '16px' }}>
        {currentStep === 'questions' && (
          <>
            <div className="card-title">
              <ClipboardList size={18} />
              <h2>Clinical intake questions</h2>
            </div>
            <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Primary complaint *
                <input
                  type="text"
                  value={triageData.primary_complaint}
                  onChange={(e) => setTriageData({ ...triageData, primary_complaint: e.target.value })}
                  placeholder="Describe the patient's primary complaint"
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                When did symptoms start? *
                <select
                  value={triageData.symptom_onset}
                  onChange={(e) => setTriageData({ ...triageData, symptom_onset: e.target.value })}
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                    background: '#fff',
                  }}
                >
                  <option value="">Select onset time</option>
                  <option value="Within the last 15 minutes">Within the last 15 minutes</option>
                  <option value="Within the last 30 minutes">Within the last 30 minutes</option>
                  <option value="Within the last hour">Within the last hour</option>
                  <option value="Within the last 2-4 hours">Within the last 2-4 hours</option>
                  <option value="Earlier today">Earlier today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="More than a day ago">More than a day ago</option>
                  <option value="Gradual onset over days">Gradual onset over days</option>
                </select>
              </label>

              <div style={{ display: 'grid', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Critical symptom screening</span>
                {[
                  {
                    key: 'severe_breathing_difficulty' as const,
                    label: 'Severe breathing difficulty?',
                    sub: 'Unable to speak in full sentences, using accessory muscles',
                  },
                  {
                    key: 'chest_pain_or_pressure' as const,
                    label: 'Chest pain or pressure?',
                    sub: 'Crushing, squeezing, or radiating pain',
                  },
                  {
                    key: 'slurred_speech_or_weakness' as const,
                    label: 'Slurred speech or sudden weakness?',
                    sub: 'Facial droop, arm weakness, speech changes',
                  },
                ].map((q) => (
                  <label
                    key={q.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '5px',
                      border: `1px solid ${triageData[q.key] ? 'var(--red)' : 'var(--border)'}`,
                      background: triageData[q.key] ? '#fef2f2' : '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={triageData[q.key]}
                      onChange={(e) => setTriageData({ ...triageData, [q.key]: e.target.checked })}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <strong>{q.label}</strong>
                      <span style={{ display: 'block', color: '#78838e', fontSize: '11px', marginTop: '2px' }}>
                        {q.sub}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Clinical notes (optional)
                <textarea
                  value={triageData.clinical_notes}
                  onChange={(e) => setTriageData({ ...triageData, clinical_notes: e.target.value })}
                  placeholder="Any additional observations or notes"
                  rows={3}
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </label>
            </div>
          </>
        )}

        {currentStep === 'vitals' && (
          <>
            <div className="card-title">
              <HeartPulse size={18} />
              <h2>Record vital signs</h2>
            </div>
            <p style={{ color: '#78838e', fontSize: '12px', marginTop: '4px' }}>
              Enter all available measurements. Leave blank if not recorded.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '16px' }}>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                SpO₂ (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={vitalsData.spo2}
                  onChange={(e) => setVitalsData({ ...vitalsData, spo2: e.target.value })}
                  placeholder="e.g. 98"
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Heart rate (bpm)
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={vitalsData.heart_rate}
                  onChange={(e) => setVitalsData({ ...vitalsData, heart_rate: e.target.value })}
                  placeholder="e.g. 72"
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Respiratory rate (/min)
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={vitalsData.respiratory_rate}
                  onChange={(e) => setVitalsData({ ...vitalsData, respiratory_rate: e.target.value })}
                  placeholder="e.g. 16"
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Systolic BP (mmHg)
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={vitalsData.systolic_bp}
                  onChange={(e) => setVitalsData({ ...vitalsData, systolic_bp: e.target.value })}
                  placeholder="e.g. 120"
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Diastolic BP (mmHg)
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={vitalsData.diastolic_bp}
                  onChange={(e) => setVitalsData({ ...vitalsData, diastolic_bp: e.target.value })}
                  placeholder="e.g. 80"
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                Temperature (°C)
                <input
                  type="number"
                  min="30"
                  max="45"
                  step="0.1"
                  value={vitalsData.temperature}
                  onChange={(e) => setVitalsData({ ...vitalsData, temperature: e.target.value })}
                  placeholder="e.g. 36.6"
                  style={{
                    fontSize: '13px',
                    padding: '9px 11px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                />
              </label>
            </div>
          </>
        )}

        {currentStep === 'review' && (
          <>
            <div className="card-title">
              <Eye size={18} />
              <h2>Review triage assessment</h2>
            </div>
            <p style={{ color: '#78838e', fontSize: '12px', marginTop: '4px' }}>
              Please review all information before submitting. The system will calculate priority automatically.
            </p>

            <div style={{ marginTop: '16px' }}>
              <div className="summary-label">Intake responses</div>
              <div className="answer-row">
                <span>Primary complaint</span>
                <strong>{triageData.primary_complaint}</strong>
              </div>
              <div className="answer-row">
                <span>Symptom onset</span>
                <strong>{triageData.symptom_onset}</strong>
              </div>
              <div className="answer-row">
                <span>Severe breathing difficulty</span>
                <strong style={triageData.severe_breathing_difficulty ? { color: 'var(--red)' } : undefined}>
                  {triageData.severe_breathing_difficulty ? 'Yes' : 'No'}
                </strong>
              </div>
              <div className="answer-row">
                <span>Chest pain or pressure</span>
                <strong style={triageData.chest_pain_or_pressure ? { color: 'var(--red)' } : undefined}>
                  {triageData.chest_pain_or_pressure ? 'Yes' : 'No'}
                </strong>
              </div>
              <div className="answer-row">
                <span>Slurred speech or weakness</span>
                <strong style={triageData.slurred_speech_or_weakness ? { color: 'var(--red)' } : undefined}>
                  {triageData.slurred_speech_or_weakness ? 'Yes' : 'No'}
                </strong>
              </div>
              {triageData.clinical_notes && (
                <div className="answer-row">
                  <span>Clinical notes</span>
                  <strong>{triageData.clinical_notes}</strong>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px' }}>
              <div className="summary-label">Vital signs</div>
              <div className="detail-vitals" style={{ marginTop: '8px', borderTop: 'none' }}>
                <div>
                  <span>SpO₂</span>
                  <strong>{vitalsData.spo2 || '—'}{vitalsData.spo2 ? '%' : ''}</strong>
                </div>
                <div>
                  <span>Heart rate</span>
                  <strong>{vitalsData.heart_rate || '—'}{vitalsData.heart_rate ? ' bpm' : ''}</strong>
                </div>
                <div>
                  <span>Resp. rate</span>
                  <strong>{vitalsData.respiratory_rate || '—'}{vitalsData.respiratory_rate ? ' /min' : ''}</strong>
                </div>
              </div>
              <div className="detail-vitals" style={{ marginTop: '0' }}>
                <div>
                  <span>Systolic BP</span>
                  <strong>{vitalsData.systolic_bp || '—'}{vitalsData.systolic_bp ? ' mmHg' : ''}</strong>
                </div>
                <div>
                  <span>Diastolic BP</span>
                  <strong>{vitalsData.diastolic_bp || '—'}{vitalsData.diastolic_bp ? ' mmHg' : ''}</strong>
                </div>
                <div>
                  <span>Temperature</span>
                  <strong>{vitalsData.temperature || '—'}{vitalsData.temperature ? ' °C' : ''}</strong>
                </div>
              </div>
            </div>

            {submitError && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '5px',
                  color: 'var(--red)',
                  fontSize: '12px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <AlertCircle size={14} />
                {submitError}
              </div>
            )}
          </>
        )}
      </section>

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          className="filter-button"
          onClick={stepIndex === 0 ? onCancel : goBack}
          style={{ fontSize: '12px' }}
        >
          <ArrowLeft size={14} />
          {stepIndex === 0 ? 'Cancel' : 'Back'}
        </button>

        {currentStep === 'review' ? (
          <button
            className="primary-action small"
            onClick={handleSubmitTriage}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                Submit triage <span>→</span>
              </>
            )}
          </button>
        ) : (
          <button
            className="primary-action small"
            onClick={goNext}
            disabled={currentStep === 'questions' && !canProceedFromQuestions}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Next step <ArrowRight size={14} />
          </button>
        )}
      </div>
    </>
  );
}
