import React from 'react';
import { CalendarDays, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { InfoIcon } from '@/components/common/InfoIcon';

export function PatientView() {
  return (
    <>
      <div className="patient-welcome">
        <div>
          <div className="eyebrow">Northside Medical Center</div>
          <h1>Hello, Jamie</h1>
          <p className="page-subtitle">Here is the latest update on your visit.</p>
        </div>
        <div className="patient-top-avatar">JS</div>
      </div>

      <section className="patient-status-card">
        <div className="status-card-top">
          <div>
            <span className="live-label">
              <span />
              Current status
            </span>
            <h2>Your visit is in progress</h2>
          </div>
          <StatusBadge>Waiting</StatusBadge>
        </div>

        <div className="queue-position">
          <div>
            <span>Your queue position</span>
            <strong>4</strong>
            <small>of 12 patients waiting</small>
          </div>
          <div className="position-divider" />
          <div>
            <span>Estimated wait</span>
            <strong>~18 min</strong>
            <small>Updated just now</small>
          </div>
        </div>

        <div className="patient-instruction">
          <InfoIcon />
          <span>
            Please remain available in the waiting area. We will call your name when it is time for your assessment.
          </span>
        </div>
      </section>

      <div className="patient-columns">
        <section className="simple-card">
          <div className="card-title">
            <CalendarDays size={18} />
            <h2>Today&apos;s visit</h2>
          </div>
          <div className="visit-line">
            <span>Visit ID</span>
            <strong>ST-2048</strong>
          </div>
          <div className="visit-line">
            <span>Status</span>
            <StatusBadge>Waiting</StatusBadge>
          </div>
          <div className="visit-line">
            <span>Next step</span>
            <strong>Nurse assessment</strong>
          </div>
          <button className="secondary-action">
            View visit details <span>→</span>
          </button>
        </section>

        <section className="simple-card">
          <div className="card-title">
            <ShieldCheck size={18} />
            <h2>Need help?</h2>
          </div>
          <p className="help-copy">
            If your symptoms change or become more severe, please tell a member of staff right away.
          </p>
          <button className="secondary-action">
            How triage works <span>→</span>
          </button>
        </section>
      </div>
    </>
  );
}
