'use client';

import React, { useState } from 'react';
import { Settings, Shield, Bell, RefreshCw, CheckCircle2, Server, Sliders } from 'lucide-react';

export function HospitalSettingsView() {
  const [liveSync, setLiveSync] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [level1Threshold, setLevel1Threshold] = useState('Immediate (0 min)');
  const [level2Threshold, setLevel2Threshold] = useState('10 minutes');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">System & Clinical Configuration</div>
          <h1>Hospital Settings</h1>
          <p className="page-subtitle">Configure department alert thresholds, WebSocket sync, and presentation demo options.</p>
        </div>
        <button
          className="primary-action small"
          onClick={handleSave}
          style={{ cursor: 'pointer' }}
        >
          {saved ? 'Settings Saved!' : 'Save Configuration'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '800px' }}>
        {/* Triage Protocol */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: '#155eef' }} />
            Emergency Severity Index (ESI) Protocols
          </h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Level 1 (Resuscitation) Alert Escalation
              </label>
              <input
                type="text"
                value={level1Threshold}
                onChange={(e) => setLevel1Threshold(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Level 2 (Emergent) Max Waiting Time
              </label>
              <input
                type="text"
                value={level2Threshold}
                onChange={(e) => setLevel2Threshold(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>

        {/* Real-time sync & alerts */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} style={{ color: '#0f8b8d' }} />
            Live Sync & Real-Time Events
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>
              <input
                type="checkbox"
                checked={liveSync}
                onChange={(e) => setLiveSync(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Enable WebSocket live queue feed (/ws/queue/)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Audio chime on Level 1 Emergency patient arrival
            </label>
          </div>
        </div>

        {/* College Demo Controls */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            College Presentation Controls
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
            Quick reset and mock scenario triggers for college demonstrations.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => alert('Queue reset to baseline demo state.')}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Demo Queue
            </button>
            <button
              onClick={() => alert('Simulated Level 1 Trauma patient triggered!')}
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Simulate Code Red Arrival
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
