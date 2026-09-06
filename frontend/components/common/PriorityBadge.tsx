import React from 'react';
import { Priority, priorityMeta } from '@/types/triage';

export function PriorityBadge({ level, compact = false }: { level: Priority; compact?: boolean }) {
  const p = priorityMeta[level];
  return (
    <span className={`priority-badge ${p.color}`}>
      <span className="priority-dot" />
      {compact ? p.code : `${p.code} — ${p.label}`}
    </span>
  );
}
