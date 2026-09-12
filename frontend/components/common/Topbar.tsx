'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Search, LogOut, CheckCheck, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Role } from '@/types/triage';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDto } from '@/lib/api/types';

interface TopbarProps {
  role: Role;
  onMenu: () => void;
}

const LEVEL_STYLES: Record<string, { color: string; bg: string; Icon: typeof Info }> = {
  critical: { color: '#dc2626', bg: '#fef2f2', Icon: AlertCircle },
  warning: { color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle },
  info: { color: '#155eef', bg: '#eff6ff', Icon: Info },
};

export function Topbar({ role, onMenu }: TopbarProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const avatarInitials =
    user?.initials ||
    (role === 'Doctor' ? 'AR' : role === 'Nurse' ? 'JL' : role === 'Admin' ? 'SM' : 'JS');

  // Close the panel on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  // Navigate via the app's section system: notifications store action_url
  // like "/patients/<id>" or "/queue"; map them onto sidebar sections.
  const handleItemClick = (n: NotificationDto) => {
    if (!n.is_read) markRead(n.id);
    setIsOpen(false);
    const url = (n.action_url || '').toLowerCase();
    if (url.includes('/patients')) {
      window.dispatchEvent(new CustomEvent('smarttriage:navigate', { detail: { section: 'Patients' } }));
    } else if (url.includes('/queue')) {
      window.dispatchEvent(new CustomEvent('smarttriage:navigate', { detail: { section: 'Queue' } }));
    }
  };

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

        <div style={{ position: 'relative' }} ref={panelRef}>
          <button
            className="icon-button"
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
            title={unreadCount ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
            onClick={() => setIsOpen((v) => !v)}
            style={{ position: 'relative' }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <i
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#dc2626',
                  color: '#fff',
                  borderRadius: '999px',
                  minWidth: '16px',
                  height: '16px',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #fff',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </i>
            )}
          </button>

          {isOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '360px',
                maxHeight: '480px',
                overflowY: 'auto',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  top: 0,
                  background: '#fff',
                }}
              >
                <strong style={{ fontSize: '14px' }}>Notifications</strong>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      title="Mark all as read"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: '#155eef',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close notifications"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  <Bell size={22} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>No notifications yet.</p>
                  <p style={{ fontSize: '11px', marginTop: '4px' }}>
                    Emergency alerts and queue updates will appear here.
                  </p>
                </div>
              ) : (
                notifications.slice(0, 25).map((n) => {
                  const style = LEVEL_STYLES[n.level] || LEVEL_STYLES.info;
                  const { Icon } = style;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '11px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: n.is_read ? '#fff' : style.bg,
                        borderLeft: n.is_read ? '3px solid transparent' : `3px solid ${style.color}`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = n.is_read ? '#fff' : style.bg)
                      }
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: style.bg,
                          color: style.color,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          border: `1px solid ${style.color}22`,
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: n.is_read ? 500 : 700,
                            color: '#0f172a',
                            lineHeight: 1.35,
                          }}
                        >
                          {n.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                          {n.message.length > 110 ? `${n.message.slice(0, 110)}…` : n.message}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {n.time_display || new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!n.is_read && (
                            <span style={{ fontSize: '10px', fontWeight: 700, color: style.color, textTransform: 'uppercase' }}>
                              {n.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

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
