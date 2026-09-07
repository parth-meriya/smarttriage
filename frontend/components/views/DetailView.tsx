import React, { useState } from 'react';
import { AlertCircle, Clock3, FileText, HeartPulse, History, CheckCircle2 } from 'lucide-react';
import { Patient } from '@/types/triage';
import { mockPatients } from '@/data/mockPatients';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Assistant } from '@/components/ai/Assistant';
import { triageApi } from '@/lib/api/services';

interface DetailViewProps {
  patient?: Patient;
  onBack: () => void;
}

export function DetailView({ patient, onBack }: DetailViewProps) {
  const p = patient || mockPatients[0];
  const [status, setStatus] = useState<string>(p.status || 'Waiting');
  const [isCalling, setIsCalling] = useState<boolean>(false);

  const handleStartConsultation = async () => {
    setIsCalling(true);
    try {
      if (p.id) {
        await triageApi.callPatient(p.id);
      }
      setStatus('In consultation');
    } catch {
      // Graceful offline fallback
      setStatus('In consultation');
    } finally {
      setIsCalling(false);
    }
  };

  const isHypoxic = p.spo2 !== undefined ? p.spo2 < 90 : p.priority === 1;
  const isTachycardic = p.heartRate !== undefined ? p.heartRate > 100 : false;
  const isTachypneic = p.respiratoryRate !== undefined ? p.respiratoryRate > 20 : false;

  const timelineEvents: [string, string][] = [
    status === 'In consultation' ? ['Just now', 'Consultation started'] : ['10:42 AM', 'Triage completed'],
    ['10:39 AM', 'Vitals recorded'],
    ['10:35 AM', 'Patient registered'],
  ];

  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← Back to command center
      </button>

      <div className="detail-header">
        <div className="patient-person">
          <div className="avatar patient-avatar large">{p.initials}</div>
          <div>
            <div className="eyebrow">Patient record · {p.mrn || 'ST-2048'}</div>
            <h1>{p.name}</h1>
            <p>
              {p.age} years · {p.gender || 'Male'} · {p.registeredAt || 'Registered today at 10:35 AM'}
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
            <p>Patient is waiting for prompt clinical assessment.</p>
            <div className="detail-vitals">
              <div>
                <span>SpO₂</span>
                <strong className={isHypoxic ? 'critical-text' : ''}>
                  {p.spo2 !== undefined ? `${p.spo2}%` : '86%'}
                </strong>
                <small className={isHypoxic ? 'critical-text' : ''}>
                  {isHypoxic ? 'Needs attention' : 'Normal'}
                </small>
              </div>
              <div>
                <span>Heart rate</span>
                <strong>
                  {p.heartRate !== undefined ? p.heartRate : 112} <em>bpm</em>
                </strong>
                <small className={isTachycardic ? 'critical-text' : ''}>
                  {isTachycardic ? 'Elevated' : 'Normal'}
                </small>
              </div>
              <div>
                <span>Respiratory rate</span>
                <strong>
                  {p.respiratoryRate !== undefined ? p.respiratoryRate : 28} <em>/min</em>
                </strong>
                <small className={isTachypneic ? 'critical-text' : ''}>
                  {isTachypneic ? 'Elevated' : 'Normal'}
                </small>
              </div>
            </div>
          </section>

          <section className="clinical-card">
            <div className="card-title">
              <HeartPulse size={18} />
              <h2>Triage responses</h2>
              <button className="card-link">View all</button>
            </div>
            <div className="answer-row">
              <span>Severe breathing difficulty?</span>
              <strong>{p.complaint.toLowerCase().includes('breathing') ? 'Yes' : 'No'}</strong>
            </div>
            <div className="answer-row">
              <span>Chest pain or pressure?</span>
              <strong>{p.complaint.toLowerCase().includes('chest') ? 'Yes' : 'No'}</strong>
            </div>
            <div className="answer-row">
              <span>Symptoms started</span>
              <strong>About 30 minutes ago</strong>
            </div>
          </section>

          <section className="clinical-card">
            <div className="card-title">
              <History size={18} />
              <h2>Patient history</h2>
            </div>
            <div className="empty-record">
              <FileText size={19} />
              <div>
                <strong>No previous records available</strong>
                <p>No previous visits or consultations are available for this patient.</p>
              </div>
            </div>
          </section>
        </main>

        <aside>
          <Assistant patient={p} />
          <section className="clinical-card timeline">
            <div className="card-title">
              <Clock3 size={18} />
              <h2>Visit timeline</h2>
            </div>
            {timelineEvents.map((x) => (
              <div className="timeline-row" key={x[0]}>
                <span>{x[0]}</span>
                <strong>{x[1]}</strong>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}
