'use client';

import { useState } from 'react';
import { Role, Patient } from '@/types/triage';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/common/Sidebar';
import { Topbar } from '@/components/common/Topbar';
import { DoctorView } from '@/components/views/DoctorView';
import { NurseView } from '@/components/views/NurseView';
import { PatientView } from '@/components/views/PatientView';
import { AdminView } from '@/components/views/AdminView';
import { DetailView } from '@/components/views/DetailView';
import { TriageWorkflow } from '@/components/triage/TriageWorkflow';
import LoginPage from '@/components/auth/LoginPage';
import RegisterPage from '@/components/auth/RegisterPage';

export default function Page() {
  const { role, switchRole, isAuthenticated, isLoading, logout } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleOpenPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleBack = () => {
    setSelectedPatient(null);
  };

  const handleRoleChange = (newRole: Role) => {
    switchRole(newRole);
    setSelectedPatient(null);
  };

  const handleAuthSwitch = () => {
    setAuthMode(prev => (prev === 'login' ? 'register' : 'login'));
  };

  if (isLoading) {
    return <div className="loading">Loading…</div>;
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <LoginPage onSwitch={handleAuthSwitch} />
    ) : (
      <RegisterPage onSwitch={handleAuthSwitch} />
    );
  }

  const view =
    role === 'Doctor' ? (
      <DoctorView onOpenPatient={handleOpenPatient} />
    ) : role === 'Nurse' ? (
      <NurseView onOpenPatient={handleOpenPatient} />
    ) : role === 'Patient' ? (
      <PatientView />
    ) : (
      <AdminView />
    );

  const renderPatientDetail = () => {
    if (!selectedPatient) return null;
    if (role === 'Nurse') {
      return (
        <TriageWorkflow
          patient={selectedPatient}
          onComplete={handleBack}
          onCancel={handleBack}
        />
      );
    }
    return <DetailView patient={selectedPatient} onBack={handleBack} />;
  };

  return (
    <div className="app-shell">
      <div className={mobileOpen ? 'sidebar-wrap open' : 'sidebar-wrap'}>
        <Sidebar role={role} setRole={handleRoleChange} />
      </div>
      <div className="main-shell">
        <Topbar role={role} onMenu={() => setMobileOpen(!mobileOpen)} />
        <div className="role-switcher">
          <span>Demo view</span>
          {(['Doctor', 'Nurse', 'Admin', 'Patient'] as Role[]).map((r) => (
            <button
              className={role === r ? 'selected' : ''}
              key={r}
              onClick={() => handleRoleChange(r)}
            >
              {r}
            </button>
          ))}
          <button
            style={{
              marginLeft: 'auto',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '5px',
              padding: '4px 9px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={logout}
            title="Sign out to Login screen"
          >
            Sign Out
          </button>
        </div>
        <main className="content">
          {selectedPatient && role !== 'Patient' ? renderPatientDetail() : view}
        </main>
      </div>
    </div>
  );
}
