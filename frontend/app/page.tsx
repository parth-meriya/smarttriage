'use client';

import { useState, useEffect } from 'react';
import { Role, Patient } from '@/types/triage';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/common/Sidebar';
import { Topbar } from '@/components/common/Topbar';
import { DoctorView } from '@/components/views/DoctorView';
import { NurseView } from '@/components/views/NurseView';
import { PatientView } from '@/components/views/PatientView';
import { AdminView } from '@/components/views/AdminView';
import { DetailView } from '@/components/views/DetailView';
import { QueueManagementView } from '@/components/views/QueueManagementView';
import { PatientsDirectoryView } from '@/components/views/PatientsDirectoryView';
import { HistoryView } from '@/components/views/HistoryView';
import { TriageStationView } from '@/components/views/TriageStationView';
import { StaffRosterView } from '@/components/views/StaffRosterView';
import { HospitalSettingsView } from '@/components/views/HospitalSettingsView';
import { PatientMyVisitView } from '@/components/views/PatientMyVisitView';
import { PatientProfileView } from '@/components/views/PatientProfileView';
import { TriageWorkflow } from '@/components/triage/TriageWorkflow';
import LoginPage from '@/components/auth/LoginPage';
import RegisterPage from '@/components/auth/RegisterPage';

const ROLE_DEFAULT_SECTIONS: Record<Role, string> = {
  Doctor: 'Command center',
  Nurse: 'Overview',
  Admin: 'Operations',
  Patient: 'Home',
};

export default function Page() {
  const { role, switchRole, isAuthenticated, isInitializing } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeSection, setActiveSection] = useState<string>(ROLE_DEFAULT_SECTIONS[role] || 'Command center');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailMode, setDetailMode] = useState<'chart' | 'triage'>('chart');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleOpenPatient = (patient: Patient, mode: 'chart' | 'triage' = 'chart') => {
    setSelectedPatient(patient);
    setDetailMode(mode);
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setDetailMode('chart');
  };

  const handleRoleChange = (newRole: Role) => {
    switchRole(newRole);
    setSelectedPatient(null);
    setDetailMode('chart');
    setActiveSection(ROLE_DEFAULT_SECTIONS[newRole] || 'Command center');
  };

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
    setSelectedPatient(null);
    setDetailMode('chart');
    setMobileOpen(false);
  };

  // Notification bell items dispatch this to jump to the relevant section
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent<{ section: string }>).detail?.section;
      if (section) handleSelectSection(section);
    };
    window.addEventListener('smarttriage:navigate', handler);
    return () => window.removeEventListener('smarttriage:navigate', handler);
  }, []);

  const handleAuthSwitch = () => {
    setAuthMode(prev => (prev === 'login' ? 'register' : 'login'));
  };

  // Only show full-page loading during the initial local session check
  if (isInitializing) {
    return <div className="loading">Loading…</div>;
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <LoginPage onSwitch={handleAuthSwitch} />
    ) : (
      <RegisterPage onSwitch={handleAuthSwitch} />
    );
  }

  // Render view depending on role & selected section
  const renderCurrentView = () => {
    // 1. Doctor Views
    if (role === 'Doctor') {
      switch (activeSection) {
        case 'Queue':
          return <QueueManagementView role={role} onOpenPatient={handleOpenPatient} />;
        case 'Patients':
          return <PatientsDirectoryView role={role} onOpenPatient={handleOpenPatient} />;
        case 'Staff & Nurses':
          return <StaffRosterView userRole="Doctor" />;
        case 'History':
          return <HistoryView role={role} />;
        case 'Command center':
        default:
          return <DoctorView onOpenPatient={handleOpenPatient} />;
      }
    }

    // 2. Nurse Views
    if (role === 'Nurse') {
      switch (activeSection) {
        case 'Patients':
          return <PatientsDirectoryView role={role} onOpenPatient={handleOpenPatient} />;
        case 'Triage':
          return <TriageStationView onOpenPatient={(p) => handleOpenPatient(p, 'triage')} />;
        case 'Queue':
          return <QueueManagementView role={role} onOpenPatient={handleOpenPatient} />;
        case 'History':
          return <HistoryView role={role} />;
        case 'Overview':
        default:
          return <NurseView onOpenPatient={handleOpenPatient} />;
      }
    }

    // 3. Admin Views
    if (role === 'Admin') {
      switch (activeSection) {
        case 'Patients':
          return <PatientsDirectoryView role={role} onOpenPatient={handleOpenPatient} />;
        case 'Queue':
          return <QueueManagementView role={role} onOpenPatient={handleOpenPatient} />;
        case 'Staff & Credentials':
        case 'Staff':
          return <StaffRosterView userRole="Admin" />;
        case 'Settings':
          return <HospitalSettingsView />;
        case 'Operations':
        default:
          return <AdminView />;
      }
    }

    // 4. Patient Views
    if (role === 'Patient') {
      switch (activeSection) {
        case 'My visit':
          return <PatientMyVisitView />;
        case 'Queue':
          return <QueueManagementView role={role} onOpenPatient={handleOpenPatient} />;
        case 'Profile':
          return <PatientProfileView />;
        case 'Home':
        default:
          return <PatientView />;
      }
    }

    return <DoctorView onOpenPatient={handleOpenPatient} />;
  };

  const renderPatientDetail = () => {
    if (!selectedPatient) return null;
    if (role === 'Nurse' && detailMode === 'triage') {
      return (
        <TriageWorkflow
          patient={selectedPatient}
          onComplete={handleBack}
          onCancel={handleBack}
        />
      );
    }
    return (
      <DetailView
        patient={selectedPatient}
        role={role}
        onBack={handleBack}
        onStartTriage={() => setDetailMode('triage')}
      />
    );
  };

  return (
    <div className="app-shell">
      <div className={mobileOpen ? 'sidebar-wrap open' : 'sidebar-wrap'}>
        <Sidebar
          role={role}
          setRole={handleRoleChange}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
        />
      </div>
      <div className="main-shell">
        <Topbar role={role} onMenu={() => setMobileOpen(!mobileOpen)} />
        <main className="content">
          {selectedPatient && role !== 'Patient' ? renderPatientDetail() : renderCurrentView()}
        </main>
      </div>
    </div>
  );
}
