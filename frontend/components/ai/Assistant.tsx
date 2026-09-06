import React from 'react';
import { BrainCircuit, FileText, MessageSquare, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { Patient } from '@/types/triage';

interface AssistantProps {
  patient?: Patient;
}

export function Assistant({ patient }: AssistantProps) {
  const firstName = patient ? patient.name.split(' ')[0] : 'John';
  const complaint = patient ? patient.complaint.toLowerCase() : 'severe breathing difficulty';
  const summaryText = patient?.spo2 && patient.spo2 < 90
    ? `${firstName} presents with ${complaint}. Recorded oxygen saturation is below the expected range (${patient.spo2}%) and requires prompt clinical assessment.`
    : patient?.bloodPressure && parseInt(patient.bloodPressure) > 160
    ? `${firstName} presents with ${complaint}. Recorded blood pressure (${patient.bloodPressure}) is significantly elevated and requires immediate medical evaluation.`
    : `${firstName} presents with ${complaint}. Recorded vital signs are being monitored and require prompt clinical assessment.`;

  return (
    <section className="assistant-panel">
      <div className="assistant-heading">
        <div className="assistant-icon">
          <BrainCircuit size={18} />
        </div>
        <div>
          <h2>Clinical assistant</h2>
          <p>AI-assisted information to support clinical review.</p>
        </div>
        <button className="icon-button">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="ai-disclaimer">
        <ShieldCheck size={14} />
        <span>
          AI-generated <b>•</b> Clinical review required
        </span>
      </div>
      <div className="summary-block">
        <div className="summary-label">Patient summary</div>
        <p>{summaryText}</p>
      </div>
      <div className="summary-block">
        <div className="summary-label">Why this patient is prioritized</div>
        <p>Priority is based on the reported symptom and recorded vital signs.</p>
      </div>
      <div className="ai-actions">
        <button>
          <MessageSquare size={15} />
          Ask about this patient
        </button>
        <button>
          <FileText size={15} />
          Summarize history
        </button>
      </div>
      <small className="ai-time">Generated just now · Structured visit data</small>
    </section>
  );
}
