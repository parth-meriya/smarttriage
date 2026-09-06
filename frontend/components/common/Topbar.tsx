import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { Role } from '@/types/triage';

interface TopbarProps {
  role: Role;
  onMenu: () => void;
}

export function Topbar({ role, onMenu }: TopbarProps) {
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
        <div className="top-avatar">
          {role === 'Doctor' ? 'AR' : role === 'Nurse' ? 'JL' : 'SM'}
        </div>
      </div>
    </header>
  );
}
