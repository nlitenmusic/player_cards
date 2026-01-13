"use client";
import React, { useState } from "react";

export default function LeaderboardTable({ entries, title, skill, component }: { entries: any[]; title?: string; skill: string; component: string }) {
  const [sortKey, setSortKey] = useState<'value'|'name'>('value');
  const sorted = [...(entries || [])].sort((a,b) => {
    if (sortKey === 'value') return (b.value ?? 0) - (a.value ?? 0);
    const an = ((a.first_name||'') + ' ' + (a.last_name||'')).toLowerCase();
    const bn = ((b.first_name||'') + ' ' + (b.last_name||'')).toLowerCase();
    return an.localeCompare(bn);
  });

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, boxSizing: 'border-box', overflow: 'hidden' }}>
      {title && <div style={{ fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>{title}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#374151' }}>
            <th style={{ width: 48 }}>#</th>
            <th style={{ cursor: 'pointer' }} onClick={() => setSortKey('name')}>Player</th>
            <th style={{ cursor: 'pointer' }} onClick={() => setSortKey('value')}>Value</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const numeric = typeof r.value === 'number' ? Math.round(r.value * 100) / 100 : r.value;
            const display = typeof r.value === 'number' ? String(numeric) : (r.value ?? '');
            const highlighted = i < 3;
            return (
            <tr key={r.player_id} style={{ background: highlighted ? '#fef3c7' : 'transparent', color: highlighted ? '#111' : 'inherit' }}>
              <td style={{ padding: '6px 8px', width: 48 }}>{i+1}</td>
              <td style={{ padding: '6px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.first_name} {r.last_name}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>{display}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
