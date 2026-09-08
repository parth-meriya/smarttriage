'use client';

import React from 'react';
import { User, Shield, Phone, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function PatientProfileView() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Personal Health Record</div>
          <h1>Patient Profile & Medical ID</h1>
          <p className="page-subtitle">Your personal emergency demographic details, known allergies, and emergency contacts.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '780px' }}>
        {/* Personal Details */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: '#155eef' }} />
            Demographic Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Full Legal Name</span>
              <strong style={{ color: '#0f172a' }}>Jamie Smith</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Medical Record Number (MRN)</span>
              <strong style={{ color: '#0f172a' }}>ST-2048</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Date of Birth</span>
              <strong style={{ color: '#0f172a' }}>March 14, 1994 (30 yrs)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Blood Group</span>
              <strong style={{ color: '#ef4444' }}>O Positive (O+)</strong>
            </div>
          </div>
        </div>

        {/* Medical Alerts & Allergies */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: '#f59e0b' }} />
            Allergies & Adverse Reactions
          </h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              Penicillin (Anaphylaxis risk)
            </span>
            <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              Sulfa Antibiotics (Rash)
            </span>
          </div>
        </div>

        {/* Emergency Contact */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={18} style={{ color: '#0f8b8d' }} />
            Emergency Contacts
          </h2>
          <div style={{ fontSize: '13px', display: 'grid', gap: '8px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Primary Contact (Spouse)</span>
              <strong style={{ color: '#0f172a' }}>Taylor Smith · +1 (555) 890-1234</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Preferred Hospital</span>
              <strong style={{ color: '#0f172a' }}>Northside Medical Center - Main Campus</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
