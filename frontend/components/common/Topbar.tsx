import React from 'react';
import { Bell, Menu, Search, LogOut } from 'lucide-react';
import { Role } from '@/types/triage';
import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  role: Role;
  onMenu: () => void;
}

export function Topbar({ role, onMenu }: TopbarProps) {
  const { user, logout } = useAuth();

  const avatarInitials =
    user?.initials ||
    (role === 'Doctor' ? 'AR' : role === 'Nurse' ? 'JL' : role === 'Admin' ? 'SM' : 'JS');

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <div className="top-search">
        <Search size={17} />
        <input placeholder="Search patients by name or ID" />
        <kbd>⌘ K</kbd>
      </div>
      <div className="top-actions">
        <span className="sync">
          <span />
          Live queue
        </span>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
          <i />
        </button>
        <div className="top-avatar" title={user?.display_name || role}>{avatarInitials}</div>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Sign out to Login screen"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
