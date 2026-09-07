'use client';

import React from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useOperations } from '@/hooks/useOperations';

export function AdminView() {
  const { metrics } = useOperations();
  const ops = metrics.operations;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Thursday, September 6, 2026 · 10:44 AM</div>
          <h1>Operations</h1>
          <p className="page-subtitle">A live view of patient flow at Northside Medical Center.</p>
        </div>
        <button className="filter-button">
          <CalendarDays size={16} /> Today <ChevronDown size={14} />
        </button>
      </div>

      <div className="operations-grid">
        <div>
          <span>Arrivals</span>
          <strong>{ops.arrivals}</strong>
          <small>{ops.arrivals_delta}</small>
        </div>
        <div>
          <span>Waiting</span>
          <strong>{ops.waiting}</strong>
          <small>{ops.waiting_subtext}</small>
        </div>
        <div>
          <span>In triage</span>
          <strong>{ops.in_triage}</strong>
          <small>{ops.in_triage_subtext}</small>
        </div>
        <div>
          <span>With doctor</span>
          <strong>{ops.with_doctor}</strong>
          <small>{ops.with_doctor_subtext}</small>
        </div>
        <div>
          <span>Completed</span>
          <strong>{ops.completed}</strong>
          <small>{ops.completed_subtext}</small>
        </div>
      </div>

      <div className="admin-columns">
        <section className="section admin-queue">
          <div className="section-heading">
            <div>
              <h2>Queue overview</h2>
              <p>Patient flow by current status.</p>
            </div>
            <button className="text-button">View queue →</button>
          </div>
          {metrics.queue_overview.map((item) => (
            <div className="flow-row" key={item.label}>
              <span className={`flow-dot ${item.color}`} />
              <strong>{item.label}</strong>
              <span className="flow-count">{item.count} patients</span>
              <div className="flow-bar">
                <i className={item.color} style={{ width: `${Math.min(item.count * 15 + 10, 100)}%` }} />
              </div>
              <span className="flow-arrow">→</span>
            </div>
          ))}
        </section>

        <section className="section activity">
          <div className="section-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Today&apos;s latest updates.</p>
            </div>
          </div>
          {metrics.recent_activity.map((a) => (
            <div className="activity-row" key={a.id}>
              <span>{a.time_display}</span>
              <div>
                <strong>{a.event_type}</strong>
                <small>{a.patient_name}</small>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
