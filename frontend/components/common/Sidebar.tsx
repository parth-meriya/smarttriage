import React from 'react';
import {
  ChevronDown,
  Clock3,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  ListFilter,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { Role } from '@/types/triage';

interface SidebarProps {
  role: Role;
  setRole: (role: Role) => void;
}

export function Sidebar({ role, setRole }: SidebarProps) {
  const links =
    role === 'Doctor'
      ? [
          ['Command center', LayoutDashboard],
          ['Queue', ListFilter],
          ['Patients', Users],
          ['History', History],
        ]
      : role === 'Nurse'
      ? [
          ['Overview', LayoutDashboard],
          ['Patients', Users],
          ['Triage', HeartPulse],
          ['Queue', ListFilter],
          ['History', History],
        ]
      : role === 'Admin'
      ? [
          ['Operations', LayoutDashboard],
          ['Patients', Users],
          ['Queue', ListFilter],
          ['Staff', UserRound],
          ['Settings', Settings],
        ]
      : [
          ['Home', LayoutDashboard],
          ['My visit', FileText],
          ['Queue', Clock3],
          ['Profile', UserRound],
        ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <HeartPulse size={19} />
        </span>
        <span>
          Smart<span>Triage</span>
        </span>
      </div>
      <div className="facility">
        <span className="facility-dot" />
        Northside Medical Center
        <ChevronDown size={14} />
      </div>
      <nav className="side-nav">
        {links.map(([label, Icon]: any, i) => (
          <button key={label as string} className={`nav-item ${i === 0 ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Queue' && <span className="nav-count">14</span>}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <button className="nav-item">
          <ShieldCheck size={18} />
          <span>Help & safety</span>
        </button>
        <div className="user-mini">
          <div className="avatar">
            {role === 'Doctor' ? 'AR' : role === 'Nurse' ? 'JL' : 'SM'}
          </div>
          <div>
            <strong>
              {role === 'Doctor'
                ? 'Dr. Alex Rivera'
                : role === 'Nurse'
                ? 'Jordan Lee'
                : role === 'Admin'
                ? 'Sam Morgan'
                : 'Jamie Smith'}
            </strong>
            <small>{role}</small>
          </div>
          <MoreHorizontal size={17} />
        </div>
      </div>
    </aside>
  );
}
