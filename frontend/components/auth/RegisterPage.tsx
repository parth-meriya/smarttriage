'use client';

import { useState } from 'react';
import { HeartPulse, ArrowRight, Eye, EyeOff, User, Phone, MapPin, AlertCircle, FileText } from 'lucide-react';
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
  const [age, setAge] = useState<number | ''>(32);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [complaint, setComplaint] = useState('');
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
        role: 'Patient',
        phone_number: phone,
        age: age ? Number(age) : 30,
        gender,
        date_of_birth: dateOfBirth || undefined,
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        complaint: complaint || 'Emergency Intake Registration',
      });
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed. Please check your information.');
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
        maxWidth: '580px',
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
          padding: '24px 28px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#155eef',
            marginBottom: '10px'
          }}>
            <HeartPulse size={24} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Smart<span style={{ color: '#38bdf8' }}>Triage</span> Patient Registration
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Register your patient health profile to be seen by our clinical team
          </p>
        </div>

        <div style={{ padding: '24px 28px', maxHeight: '80vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              padding: '12px 16px',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '18px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Account Credentials */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#155eef', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> 1. Account Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. john_doe"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
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
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical & Demographic Details */}
            <div style={{ marginBottom: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f8b8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HeartPulse size={14} /> 2. Health & Demographics
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Age *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State / Address"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Current Health Complaint / Reason for Visit *
                </label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Describe your symptoms (e.g. Sharp abdominal pain, fever and nausea for 2 days...)"
                  required
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> 3. Emergency Contact (Optional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Contact Name & Relation
                  </label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="e.g. Sarah Smith (Spouse)"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+1 (555) 999-9999"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
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
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(21, 94, 239, 0.25)'
              }}
            >
              <span>{isLoading ? 'Registering & creating health profile...' : 'Register Patient & Enter Queue'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{
            marginTop: '16px',
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

