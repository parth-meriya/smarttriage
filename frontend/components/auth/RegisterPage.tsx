'use client';

import { useState } from 'react';
import { HeartPulse, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  onSwitch: () => void;
};

export default function RegisterPage({ onSwitch }: Props) {
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({
        username,
        password,
        first_name: firstName,
        last_name: lastName,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed');
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
            Create a New Clinical Account
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

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
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
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
              <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b'
          }}>
            Already have an account?{' '}
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
              Log in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
