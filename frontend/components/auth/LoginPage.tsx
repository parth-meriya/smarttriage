'use client';

import { useState } from 'react';
import { HeartPulse, Stethoscope, UserCheck, Shield, User, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_CREDENTIALS } from '@/lib/api/auth';
import { UserRole } from '@/lib/api/types';

type Props = {
  onSwitch: () => void;
};

const ROLES_INFO: { role: UserRole; name: string; title: string; icon: any; color: string; bg: string }[] = [
  {
    role: 'Doctor',
    name: 'Dr. Alex Rivera',
    title: 'Emergency Physician',
    icon: Stethoscope,
    color: '#155eef',
    bg: '#eff6ff',
  },
  {
    role: 'Nurse',
    name: 'Jordan Lee, RN',
    title: 'Triage Nurse',
    icon: UserCheck,
    color: '#0f8b8d',
    bg: '#e6f6f5',
  },
  {
    role: 'Admin',
    name: 'Sam Morgan',
    title: 'Operations Director',
    icon: Shield,
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    role: 'Patient',
    name: 'Jamie Smith',
    title: 'Active Patient (Queue #4)',
    icon: User,
    color: '#d97706',
    bg: '#fffbeb',
  },
];

export default function LoginPage({ onSwitch }: Props) {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('dr_alex');
  const [password, setPassword] = useState('DoctorPass123!');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UserRole>('Doctor');

  const handleOneTapLogin = async (role: UserRole) => {
    setError(null);
    try {
      const creds = DEMO_CREDENTIALS[role];
      setUsername(creds.username);
      setPassword(creds.password);
      setActiveTab(role);
      await login(creds.username, creds.password);
    } catch (err: any) {
      setError(err?.message ?? `${role} login failed`);
    }
  };

  const handleSelectRole = (role: UserRole) => {
    setActiveTab(role);
    const creds = DEMO_CREDENTIALS[role];
    setUsername(creds.username);
    setPassword(creds.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.message ?? 'Invalid username or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
      padding: '24px',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '28px 32px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#155eef',
            marginBottom: '12px'
          }}>
            <HeartPulse size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Smart<span style={{ color: '#38bdf8' }}>Triage</span>
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            AI-Powered Clinical Queue & Hospital Triage System
          </p>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              padding: '12px 16px',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {/* Quick One-Tap Demo Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748b'
              }}>
                One-Tap College Demo Login
              </span>
              <span style={{
                fontSize: '11px',
                background: '#e0f2fe',
                color: '#0284c7',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600'
              }}>
                Instant Access
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {ROLES_INFO.map((item) => {
                const IconComponent = item.icon;
                const isSelected = activeTab === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleOneTapLogin(item.role)}
                    disabled={isLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${item.color}` : '1px solid #e2e8f0',
                      background: isSelected ? item.bg : '#f8fafc',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: item.bg,
                      color: item.color,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={18} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                        {item.role}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: '#94a3b8',
            fontSize: '12px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ padding: '0 12px' }}>or sign in with credentials</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: '#155eef',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Register Toggle */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b'
          }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitch}
              style={{
                background: 'none',
                border: 'none',
                color: '#155eef',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
