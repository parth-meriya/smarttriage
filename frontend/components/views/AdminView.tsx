import React from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

export function AdminView() {
  const queueOverviewData: [string, string, string][] = [
    ['Emergency', '1', 'red'],
    ['High priority', '2', 'amber'],
    ['Urgent', '5', 'gold'],
    ['Non-urgent', '4', 'teal'],
  ];

  const recentActivityData: [string, string, string][] = [
    ['10:42 AM', 'Triage completed', 'David Kim'],
    ['10:39 AM', 'Vitals recorded', 'Eleanor Wright'],
    ['10:35 AM', 'Patient registered', 'Aisha Patel'],
    ['10:31 AM', 'Consultation started', 'Maria Santos'],
  ];

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
          <strong>24</strong>
          <small>+4 from yesterday</small>
        </div>
        <div>
          <span>Waiting</span>
          <strong>12</strong>
          <small>8 under 30 min</small>
        </div>
        <div>
          <span>In triage</span>
          <strong>3</strong>
          <small>2 nurses active</small>
        </div>
        <div>
          <span>With doctor</span>
          <strong>5</strong>
          <small>3 rooms occupied</small>
        </div>
        <div>
          <span>Completed</span>
          <strong>18</strong>
          <small>Today</small>
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
          {queueOverviewData.map(([label, count, color]) => (
            <div className="flow-row" key={label}>
              <span className={`flow-dot ${color}`} />
              <strong>{label}</strong>
              <span className="flow-count">{count} patients</span>
              <div className="flow-bar">
                <i className={color} style={{ width: `${Number(count) * 15 + 10}%` }} />
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
          {recentActivityData.map((a) => (
            <div className="activity-row" key={a[0]}>
              <span>{a[0]}</span>
              <div>
                <strong>{a[1]}</strong>
                <small>{a[2]}</small>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
