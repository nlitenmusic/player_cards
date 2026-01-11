"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Achievement = {
  id: number;
  key: string;
  name: string;
  description?: string;
  icon_url?: string;
  rule_type?: string;
  rule_payload?: any;
};

export default function AchievementsPage() {
  const [items, setItems] = useState<Achievement[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/achievements');
        const j = await res.json();
        if (!res.ok) throw new Error((j && j.error) ? j.error : `HTTP ${res.status}`);
        setItems(j.achievements || []);
      } catch (e:any) {
        setError(String(e?.message || e));
        setItems([]);
      } finally { setLoading(false); }
    })();
  }, []);

  function ruleSummary(a: Achievement) {
    const p = a.rule_payload || {};
    if (a.rule_type === 'top_by_skill') {
      const skill = p.skill || p.skill_type || '';
      const comp = (p.component || '').toString();
      const topN = p.top_n ?? p.topN ?? 1;

      const compMap: Record<string, string> = {
        c: 'Consistency',
        p: 'Power',
        a: 'Accuracy',
        s: 'Spin',
        t: 'Technique',
      };
      const compWord = comp ? (compMap[comp.toLowerCase()] || comp.toUpperCase()) : '';
      const compLetter = comp ? comp.toUpperCase() : '';

        // Format: "Rank N: Skill Component" (e.g., "Rank 1: Forehand Technique")
        if (skill && compWord) return `Rank ${topN}: ${skill} ${compWord}`;
        if (skill) return `Rank ${topN}: ${skill}`;
        if (compWord) return `Rank ${topN}: ${compWord}`;
        return `Rank ${topN}`;
    }
    return a.rule_type || '';
  }

  return (
    <div style={{ padding: 20, maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Achievements</h1>
      </div>

      {loading && <div>Loading achievements…</div>}
      {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}

      {!loading && items && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e6e6e6' }}>
                  <th style={{ padding: '8px 12px' }}>Icon</th>
                  <th style={{ padding: '8px 12px' }}>Achievement</th>
                  <th style={{ padding: '8px 12px' }}>Description</th>
                </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id || a.key} style={{ borderBottom: '1px solid #f1f1f1' }}>
                <td style={{ padding: '10px 12px', width: 80 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: a.icon_url ? 'transparent' : '#efefef', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)', border: '2px solid #000', boxSizing: 'border-box' }}>
                    {a.icon_url ? (
                      <img src={a.icon_url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <span style={{ fontSize: 20 }}>🏅</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '10px 12px', verticalAlign: 'top', fontWeight: 600 }}>{a.name}</td>
                <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{a.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999 }}>
        <Link href="/">
          <button aria-label="Cards" title="Cards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="#111" strokeWidth="1.2"/><rect x="14" y="3" width="7" height="7" stroke="#111" strokeWidth="1.2"/><rect x="3" y="14" width="7" height="7" stroke="#111" strokeWidth="1.2"/><rect x="14" y="14" width="7" height="7" stroke="#111" strokeWidth="1.2"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Cards</div>
          </button>
        </Link>
      </div>
    </div>
  );
}
