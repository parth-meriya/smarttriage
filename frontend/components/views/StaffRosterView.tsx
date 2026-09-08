'use client';

import React, { useState, useEffect } from 'react';
import {
  UserRound,
  Stethoscope,
  Shield,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  X,
  Lock,
  Building,
  UserCheck
} from 'lucide-react';
import { Role } from '@/types/triage';
import { useAuth } from '@/hooks/useAuth';
import {
  StaffAccount,
  getStaffAccounts,
  saveStaffAccount,
  deleteStaffAccount
} from '@/lib/api/staff';

interface StaffRosterViewProps {
  userRole?: Role;
}

export function StaffRosterView({ userRole = 'Admin' }: StaffRosterViewProps) {
  const { user } = useAuth();
  const isDoctor = userRole === 'Doctor';
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>(isDoctor ? 'Nurse' : 'ALL');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'Doctor' | 'Nurse' | 'Admin'>(isDoctor ? 'Nurse' : 'Doctor');
  const [formTitle, setFormTitle] = useState(isDoctor ? 'Staff Triage Nurse' : 'Attending Physician');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDepartment, setFormDepartment] = useState('Emergency Department');
  const [formRoom, setFormRoom] = useState(isDoctor ? 'Triage Station 2' : 'Exam Room 2');
  const [formPhone, setFormPhone] = useState('+1 (555) 000-1234');

  useEffect(() => {
    setAccounts(getStaffAccounts());
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreateModal = () => {
    setFormRole(isDoctor ? 'Nurse' : 'Doctor');
    setFormTitle(isDoctor ? 'Staff Triage Nurse' : 'Attending Physician');
    setFormUsername('');
    setFormPassword('Pass' + Math.floor(1000 + Math.random() * 9000) + '!');
    setFormName('');
    setShowModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formPassword || !formName) return;

    const createdBy = isDoctor
      ? (user?.display_name ? `Hospital (${user.display_name})` : 'Hospital (Doctor)')
      : 'Hospital Admin';

    const newAcc = saveStaffAccount({
      name: formName,
      role: formRole,
      title: formTitle,
      username: formUsername.trim().toLowerCase(),
      password: formPassword,
      department: formDepartment,
      room: formRoom,
      phone: formPhone,
      createdBy,
    });

    setAccounts(getStaffAccounts());
    setShowModal(false);
    showToast(`Successfully created account for ${newAcc.name} (Username: ${newAcc.username})`);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete credentials for ${name}? They will no longer be able to log in.`)) {
      deleteStaffAccount(id);
      setAccounts(getStaffAccounts());
      showToast(`Deleted credentials for ${name}`);
    }
  };

  const filtered = accounts.filter((s) => {
    if (isDoctor) {
      return s.role === 'Nurse';
    }
    return roleFilter === 'ALL' || s.role === roleFilter;
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {isDoctor ? 'Hospital Nursing Credentials' : 'Hospital Staff & Credentials Management'}
          </div>
          <h1>{isDoctor ? 'Nurse Account Management' : 'Staff Credentials & Access Roster'}</h1>
          <p className="page-subtitle">
            {isDoctor
              ? 'Hospital physicians can create, issue, and delete Nurse login credentials.'
              : 'Hospital administrators can create, issue, and delete Doctor, Nurse, and Admin credentials.'}
          </p>
        </div>
        <button
          className="primary-action small"
          onClick={handleOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isDoctor ? '#0f8b8d' : '#155eef',
            cursor: 'pointer',
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '13px'
          }}
        >
          <Plus size={16} />
          <span>{isDoctor ? 'Create Nurse ID & Pass' : 'Create Staff ID & Pass'}</span>
        </button>
      </div>

      {notification && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Tabs (Admin only) */}
      {!isDoctor && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['ALL', 'Doctor', 'Nurse', 'Admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                border: '1px solid',
                borderColor: roleFilter === r ? '#155eef' : '#e2e8f0',
                background: roleFilter === r ? '#eff6ff' : '#fff',
                color: roleFilter === r ? '#155eef' : '#475569',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: roleFilter === r ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {r === 'ALL' ? 'All Staff' : `${r}s`}
            </button>
          ))}
        </div>
      )}

      {/* Staff List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {filtered.map((staff) => {
          const isPwVisible = !!visiblePasswords[staff.id];
          const initials = staff.name.slice(0, 2).toUpperCase();

          return (
            <div
              key={staff.id}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: staff.role === 'Doctor' ? '#eff6ff' : staff.role === 'Nurse' ? '#e6f6f5' : '#f5f3ff',
                      color: staff.role === 'Doctor' ? '#155eef' : staff.role === 'Nurse' ? '#0f8b8d' : '#7c3aed',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {initials}
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{staff.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{staff.title} ({staff.id})</span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: staff.role === 'Doctor' ? '#dbeafe' : staff.role === 'Nurse' ? '#ccfbf1' : '#f3e8ff',
                    color: staff.role === 'Doctor' ? '#1e40af' : staff.role === 'Nurse' ? '#115e59' : '#6b21a8'
                  }}>
                    {staff.role}
                  </span>
                </div>

                {/* Info Fields */}
                <div style={{ fontSize: '12px', color: '#475569', display: 'grid', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '14px' }}>
                  <div>Department: <strong>{staff.department}</strong></div>
                  <div>Station / Room: <strong>{staff.room}</strong></div>
                  <div>Created By: <strong style={{ color: '#0f172a' }}>{staff.createdBy}</strong></div>
                </div>

                {/* Credentials Box (Username & Password) */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
                    <KeyRound size={13} style={{ color: '#155eef' }} />
                    <span>Login Credentials</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Username:</span>
                    <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, color: '#0f172a' }}>
                      {staff.username}
                    </code>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Password:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, color: '#0f172a' }}>
                        {isPwVisible ? staff.password : '••••••••••••'}
                      </code>
                      <button
                        type="button"
                        onClick={() => togglePassword(staff.id)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={isPwVisible ? 'Hide password' : 'View password'}
                      >
                        {isPwVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border)',
                paddingTop: '12px'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Issued: {staff.createdAt}
                </span>

                <button
                  type="button"
                  onClick={() => handleDelete(staff.id, staff.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Revoke and delete this account"
                >
                  <Trash2 size={14} />
                  <span>Delete ID</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Staff / Nurse Credentials */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                {isDoctor ? 'Create New Nurse Credentials' : 'Create New Hospital Staff ID & Pass'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              {/* Role selector (if Admin) */}
              {!isDoctor && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Staff Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => {
                      const r = e.target.value as 'Doctor' | 'Nurse' | 'Admin';
                      setFormRole(r);
                      setFormTitle(r === 'Doctor' ? 'Attending Physician' : r === 'Nurse' ? 'Staff Triage Nurse' : 'Hospital Operations Admin');
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="Doctor">Doctor (Physician)</option>
                    <option value="Nurse">Nurse (Triage Staff)</option>
                    <option value="Admin">Hospital Administrator</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Full Name & Credentials
                </label>
                <input
                  type="text"
                  placeholder={formRole === 'Doctor' ? 'e.g. Dr. Marcus Cole, MD' : 'e.g. Chloe Bennett, RN'}
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!formUsername) {
                      setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15));
                    }
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Assigned Station / Room
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Login Credentials Section */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#155eef', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} />
                  <span>Login Access Credentials</span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Username (Login ID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. nurse_chloe"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Password
                  </label>
                  <input
                    type="text"
                    placeholder="Enter password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isDoctor ? '#0f8b8d' : '#155eef',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Create & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
