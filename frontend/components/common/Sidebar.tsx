'use client';

import React from 'react';
import {
  ChevronDown,
  Clock3,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { Role } from '@/types/triage';
import { useAuth } from '@/hooks/useAuth';
import { useQueue } from '@/hooks/useQueue';

interface SidebarProps {
  role: Role;
  setRole: (role: Role) => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export function Sidebar({ role, setRole, activeSection, onSelectSection }: SidebarProps) {
  const { user, logout } = useAuth();
  const { counts } = useQueue();

  const links =
    role === 'Doctor'
      ? [
          ['Command center', LayoutDashboard],
          ['Queue', ListFilter],
          ['Patients', Users],
          ['Staff & Nurses', UserRound],
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
          ['Staff & Credentials', UserRound],
          ['Settings', Settings],
        ]
      : [
          ['Home', LayoutDashboard],
          ['My visit', FileText],
          ['Queue', Clock3],
          ['Profile', UserRound],
        ];

  const displayName =
    user?.display_name ||
    (role === 'Doctor'
      ? 'Dr. Alex Rivera'
      : role === 'Nurse'
      ? 'Jordan Lee'
      : role === 'Admin'
      ? 'Sam Morgan'
      : 'Jamie Smith');

  const avatarInitials =
    user?.initials ||
    (role === 'Doctor' ? 'AR' : role === 'Nurse' ? 'JL' : role === 'Admin' ? 'SM' : 'JS');

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
        {links.map(([label, Icon]: any) => {
          const isActive = activeSection === label;
          return (
            <button
              key={label as string}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectSection(label)}
              type="button"
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Queue' && (
                <span className="nav-count">{counts.total_waiting || 6}</span>
              )}
              {label === 'Triage' && (
                <span className="nav-count" style={{ background: '#fef2f2', color: '#ef4444' }}>
                  {counts.emergency + counts.high_priority}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="side-bottom">
        <button
          className="nav-item"
          onClick={() => alert('SmartTriage Emergency System v2.4 · Contact Clinical Engineering: ext 4402')}
        >
          <ShieldCheck size={18} />
          <span>Help & safety</span>
        </button>
        <div className="user-mini">
          <div className="avatar">{avatarInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </strong>
            <small>{role}</small>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 0,
              color: '#ef4444',
              cursor: 'pointer',
              padding: '4px',
              display: 'grid',
              placeItems: 'center'
            }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
