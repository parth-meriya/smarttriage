'use client'

import { useState } from 'react'
import { Role, Patient } from '@/types/triage'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/common/Sidebar'
import { Topbar } from '@/components/common/Topbar'
import { DoctorView } from '@/components/views/DoctorView'
import { NurseView } from '@/components/views/NurseView'
import { PatientView } from '@/components/views/PatientView'
import { AdminView } from '@/components/views/AdminView'
import { DetailView } from '@/components/views/DetailView'

export default function Page() {
  const { role, switchRole } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleOpenPatient = (patient: Patient) => {
    setSelectedPatient(patient)
  }

  const handleBack = () => {
    setSelectedPatient(null)
  }

  const handleRoleChange = (newRole: Role) => {
    switchRole(newRole)
    setSelectedPatient(null)
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
    )

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
        </div>
        <main className="content">
          {selectedPatient && role !== 'Patient' ? (
            <DetailView patient={selectedPatient} onBack={handleBack} />
          ) : (
            view
          )}
        </main>
      </div>
    </div>
  )
}
