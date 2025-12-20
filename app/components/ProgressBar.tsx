'use client';
import React from 'react';

export default function ProgressBar({
  value,
  color = '#3b82f6',
  height = 10,
  label,
}: {
  value: number;
  color?: string;
  height?: number | string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div style={{ marginTop: 8 }} aria-label={label ?? 'progress'}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</div>

      <div style={{ height, width: '100%', background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 300ms ease' }} />
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>{Math.round(pct)}%</div>
    </div>
  );
}
