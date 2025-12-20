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
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      {title && <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
            return (
            <tr key={r.player_id} style={{ background: i < 3 ? '#fef3c7' : 'transparent' }}>
              <td style={{ padding: '6px 8px' }}>{i+1}</td>
              <td style={{ padding: '6px 8px' }}>{r.first_name} {r.last_name}</td>
              <td style={{ padding: '6px 8px' }}>{display}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
