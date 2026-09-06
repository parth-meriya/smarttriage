import React from 'react';

export function StatusBadge({ children }: { children: string }) {
  return (
    <span
      className={`status-badge ${
        children === 'Waiting'
          ? 'waiting'
          : children === 'In consultation'
          ? 'consulting'
          : ''
      }`}
    >
      <span className="status-dot" />
      {children}
    </span>
  );
}
