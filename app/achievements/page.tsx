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
        <Link href="/"><button type="button">Back to Home</button></Link>
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
              <th style={{ padding: '8px 12px' }}>What it takes</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id || a.key} style={{ borderBottom: '1px solid #f1f1f1' }}>
                <td style={{ padding: '10px 12px', width: 80 }}>
                  {a.icon_url ? (
                    <img src={a.icon_url} alt={a.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, background: '#efefef', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>🏅</div>
                  )}
                </td>
                <td style={{ padding: '10px 12px', verticalAlign: 'top', fontWeight: 600 }}>{a.name}</td>
                <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{a.description || '—'}</td>
                <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{ruleSummary(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
