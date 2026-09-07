'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, FileText, MessageSquare, MoreHorizontal, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { Patient } from '@/types/triage';
import { triageApi } from '@/lib/api/services';

interface AssistantProps {
  patient?: Patient;
}

export function Assistant({ patient }: AssistantProps) {
  const p = patient;
  const firstName = p ? p.name.split(' ')[0] : 'John';
  const complaint = p ? p.complaint.toLowerCase() : 'severe breathing difficulty';

  const defaultSummary = p?.spo2 && p.spo2 < 90
    ? `${firstName} presents with ${complaint}. Recorded oxygen saturation is below the expected range (${p.spo2}%) and requires prompt clinical assessment.`
    : p?.bloodPressure && parseInt(p.bloodPressure) > 160
    ? `${firstName} presents with ${complaint}. Recorded blood pressure (${p.bloodPressure}) is significantly elevated and requires immediate medical evaluation.`
    : `${firstName} presents with ${complaint}. Recorded vital signs are being monitored and require prompt clinical assessment.`;

  const [summary, setSummary] = useState<string>(defaultSummary);
  const [rationale, setRationale] = useState<string>('Priority is based on the reported symptom and recorded vital signs.');
  const [timestamp, setTimestamp] = useState<string>('Generated just now · Structured visit data');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // Interactive Clinical Q&A State
  const [showChat, setShowChat] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);

  // Sync summary when selected patient changes
  useEffect(() => {
    setSummary(defaultSummary);
    setChatAnswer(null);
    setShowChat(false);
    setQuestion('');
  }, [p?.name, defaultSummary]);

  // Handle live AI summarization
  const handleSummarize = async () => {
    if (!p) return;
    setIsSummarizing(true);
    try {
      const res = await triageApi.evaluateWithAI({
        patient_name: p.name,
        age: p.age,
        gender: p.gender || 'Male',
        complaint: p.complaint,
        onset: 'About 30 minutes ago',
        severe_breathing_difficulty: p.complaint.toLowerCase().includes('breathing'),
        vitals: {
          spo2: p.spo2,
          heart_rate: p.heartRate,
          respiratory_rate: p.respiratoryRate,
        },
      });
      if (res && res.patient_summary) {
        setSummary(res.patient_summary);
        if (res.urgency_rationale) setRationale(res.urgency_rationale);
        setTimestamp('Generated just now · AI Clinical Decision Support');
      }
    } catch {
      setSummary(defaultSummary);
      setRationale('Clinical assistant temporarily unavailable. Patient workflow and priority calculations continue as standard.');
      setTimestamp('Standard protocol active · AI offline');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle interactive clinical Q&A
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !p) return;

    setIsAsking(true);
    try {
      const res = await triageApi.askAssistant({
        patient_name: p.name,
        complaint: p.complaint,
        question: question.trim(),
      });
      if (res && res.answer) {
        setChatAnswer(res.answer);
      }
    } catch {
      setChatAnswer(`Clinical assistant is temporarily unavailable. Please proceed with standard clinical review for ${firstName}. The patient workflow is not affected.`);
    } finally {
      setIsAsking(false);
    }
  };

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
        <button className="icon-button" aria-label="More options">
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
        <p>{isSummarizing ? 'Analyzing patient presentation and vitals...' : summary}</p>
      </div>

      <div className="summary-block">
        <div className="summary-label">Why this patient is prioritized</div>
        <p>{rationale}</p>
      </div>

      {showChat && (
        <div style={{ margin: '14px 0', padding: '12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px' }}>
          <form onSubmit={handleAskQuestion} style={{ display: 'flex', gap: '6px', marginBottom: chatAnswer ? '10px' : '0' }}>
            <input
              type="text"
              placeholder={`Ask about ${firstName}'s condition...`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                flex: 1,
                fontSize: '11px',
                padding: '7px 9px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              style={{
                background: 'var(--teal)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {isAsking ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>

          {chatAnswer && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#4d5965', lineHeight: '1.5', background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <strong>AI Decision Support:</strong> {chatAnswer}
            </div>
          )}
        </div>
      )}

      <div className="ai-actions">
        <button onClick={() => setShowChat(!showChat)}>
          <MessageSquare size={15} />
          {showChat ? 'Close question' : 'Ask about this patient'}
        </button>
        <button onClick={handleSummarize} disabled={isSummarizing}>
          <FileText size={15} />
          {isSummarizing ? 'Summarizing...' : 'Summarize history'}
        </button>
      </div>

      <small className="ai-time">{timestamp}</small>
    </section>
  );
}
