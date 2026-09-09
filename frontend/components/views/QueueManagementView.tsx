'use client';

import React, { useState } from 'react';
import { Search, ListFilter, Clock3, AlertCircle, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { Role, Patient } from '@/types/triage';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useQueue } from '@/hooks/useQueue';

interface QueueManagementViewProps {
  role: Role;
  onOpenPatient: (patient: Patient) => void;
}

export function QueueManagementView({ role, onOpenPatient }: QueueManagementViewProps) {
  const { allPatients, counts, isLiveConnected } = useQueue();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = allPatients.filter((p) => {
    // Search filter
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.complaint.toLowerCase().includes(search.toLowerCase()) ||
      (p.mrn && p.mrn.toLowerCase().includes(search.toLowerCase()));

    // Priority filter
    const matchesPriority =
      priorityFilter === 'ALL' ||
      (priorityFilter === '1' && (p.priority === 1 || (p.priority as any) === 'Level 1' || (p.priority as any) === 'Emergency')) ||
      (priorityFilter === '2' && (p.priority === 2 || (p.priority as any) === 'Level 2' || (p.priority as any) === 'High Priority')) ||
      (priorityFilter === '3' && (p.priority === 3 || (p.priority as any) === 'Level 3' || (p.priority as any) === 'Urgent')) ||
      (priorityFilter === '4_5' && (p.priority === 4 || (p.priority as any) === 'Level 4' || (p.priority as any) === 'Level 5' || (p.priority as any) === 'Non-urgent'));

    // Status filter
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'WAITING' && (!p.status || p.status === 'Waiting')) ||
      (statusFilter === 'TRIAGE' && (p.status === 'In triage' || p.status === 'Needs triage')) ||
      (statusFilter === 'CONSULTING' && p.status === 'In consultation');

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Clinical Queue Management</div>
          <h1>{role === 'Admin' ? 'Hospital Department Queue' : 'Live Patient Queue'}</h1>
          <p className="page-subtitle">
            {isLiveConnected
              ? 'Real-time WebSocket connection active · Auto-updated queue'
              : 'Sorted by clinical urgency and arrival timestamp'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isLiveConnected ? '#dcfce7' : '#f1f5f9',
            color: isLiveConnected ? '#15803d' : '#475569',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLiveConnected ? '#16a34a' : '#94a3b8'
            }} />
            {isLiveConnected ? 'Live Feed Connected' : 'Auto Sync Active'}
          </span>
        </div>
      </div>

      {/* Metric summary banner */}
      <div className="workflow-cards" style={{ marginBottom: '24px' }}>
        <div
          className="workflow-card urgent"
          onClick={() => setPriorityFilter(priorityFilter === '1' ? 'ALL' : '1')}
          style={{ cursor: 'pointer', border: priorityFilter === '1' ? '2px solid #ef4444' : undefined }}
        >
          <AlertCircle size={20} />
          <div>
            <strong>{counts.emergency}</strong>
            <span>Emergency (Level 1)</span>
          </div>
        </div>
        <div
          className="workflow-card"
          onClick={() => setPriorityFilter(priorityFilter === '2' ? 'ALL' : '2')}
          style={{ cursor: 'pointer', border: priorityFilter === '2' ? '2px solid #f59e0b' : undefined }}
        >
          <Clock3 size={20} style={{ color: '#f59e0b' }} />
          <div>
            <strong>{counts.high_priority}</strong>
            <span>High Priority (Level 2)</span>
          </div>
        </div>
        <div
          className="workflow-card"
          onClick={() => setStatusFilter(statusFilter === 'WAITING' ? 'ALL' : 'WAITING')}
          style={{ cursor: 'pointer', border: statusFilter === 'WAITING' ? '2px solid #155eef' : undefined }}
        >
          <UserCheck size={20} />
          <div>
            <strong>{counts.total_waiting}</strong>
            <span>Total Waiting</span>
          </div>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '6px 12px',
          minWidth: '280px',
          flex: '1 1 300px'
        }}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search patient name, MRN, complaint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Acuity:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: '1', label: 'L1 Resuscitation' },
            { id: '2', label: 'L2 Emergent' },
            { id: '3', label: 'L3 Urgent' },
            { id: '4_5', label: 'L4/5 Non-Urgent' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPriorityFilter(item.id)}
              style={{
                border: '1px solid',
                borderColor: priorityFilter === item.id ? '#155eef' : '#e2e8f0',
                background: priorityFilter === item.id ? '#eff6ff' : '#fff',
                color: priorityFilter === item.id ? '#155eef' : '#475569',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: priorityFilter === item.id ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <div className="queue-table">
        <div className="queue-header" style={{ gridTemplateColumns: '1.2fr 1.6fr 1fr 1.2fr 0.8fr 1fr 0.8fr' }}>
          <span>Patient</span>
          <span>Complaint & Details</span>
          <span>Acuity Level</span>
          <span>Vital Signs</span>
          <span>Wait Time</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>No patients match the current filters.</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Try adjusting your search query or acuity filter.</p>
          </div>
        ) : (
          filtered.map((patient, idx) => {
            const vitals = (patient as any).vitals || (patient as any).vital;
            return (
              <div
                key={patient.id || patient.mrn || idx}
                className="patient-row"
                style={{
                  gridTemplateColumns: '1.2fr 1.6fr 1fr 1.2fr 0.8fr 1fr 0.8fr',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onClick={() => onOpenPatient(patient)}
              >
                <div className="patient-person">
                  <div className="avatar">{patient.initials || patient.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{patient.name}</strong>
                    <span>{patient.mrn} · {patient.age ? `${patient.age}y` : ''} {patient.gender || ''}</span>
                  </div>
                </div>

                <div>
                  <div className="complaint" style={{ fontWeight: 600, color: '#1e293b' }}>
                    {patient.complaint}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {(patient as any).arrival_time ? `Arrived ${(patient as any).arrival_time}` : (patient.registeredAt ? `Arrived ${patient.registeredAt}` : 'Arrived recently')}
                  </span>
                </div>

                <div>
                  <PriorityBadge level={patient.priority} />
                </div>

                <div>
                  {vitals ? (
                    <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                      {vitals.bp && <span>BP: <strong>{vitals.bp}</strong> </span>}
                      {vitals.hr && <span>HR: <strong>{vitals.hr}</strong> </span>}
                      {vitals.spo2 && <span>O2: <strong>{vitals.spo2}%</strong></span>}
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Awaiting vitals</span>
                  )}
                </div>

                <div className="wait">
                  <Clock3 size={13} />
                  <span>{patient.wait || (patient as any).wait_time || (patient as any).waitTime || '12 min'}</span>
                </div>

                <div>
                  <StatusBadge>{patient.status || 'Waiting'}</StatusBadge>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    className="row-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPatient(patient);
                    }}
                  >
                    {role === 'Nurse' ? 'Triage →' : 'Open →'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
