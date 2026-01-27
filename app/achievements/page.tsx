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
  const [skillFilter, setSkillFilter] = useState<string>('all');

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

  function extractSkill(a: Achievement) {
    try {
      const p = a.rule_payload || {};
      return (p.skill || p.skill_type || '').toString();
    } catch (e) { return '' }
  }

  return (
    <div className="achievements-page" style={{ padding: '48px 20px 20px', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
        {!loading && <h1 style={{ margin: 0, textTransform: 'uppercase' }}>ACHIEVEMENTS</h1>}
        {!loading && items && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Build skill list from payloads */}
            {(() => {
              const skills = Array.from(new Set((items || []).map(extractSkill).filter(s => !!s)));
              return (
                <>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Filter:</label>
                  <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)} style={{ padding: '6px 8px' }}>
                    <option value="all">All skills</option>
                    {skills.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {/* sort selector removed */}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }} aria-hidden>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 84, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#fff', border: '2px solid #111', boxSizing: 'border-box' }}>
              <svg width="56" height="40" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="#111" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="#111" strokeWidth="1" fill="#f7f7f7" />
              </svg>
            </div>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#111', animation: 'pc-blink 900ms infinite' }} />
          </div>
          <style>{`@keyframes pc-blink {0% { opacity: 0.15; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.15; transform: scale(0.9); } }`}</style>
        </div>
      )}
      {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}

      {!loading && items && (
        (() => {
          // apply filter + sort
          let displayed = (items || []).slice();
          if (skillFilter && skillFilter !== 'all') {
            displayed = displayed.filter(i => extractSkill(i) === skillFilter);
          }
          // Randomize order so users see a variety on first view
          for (let i = displayed.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = displayed[i];
            displayed[i] = displayed[j];
            displayed[j] = tmp;
          }

          return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e6e6e6' }}>
                  <th style={{ padding: '8px 12px' }}>Icon</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Achievement</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Description</th>
                </tr>
          </thead>
              <tbody>
                {displayed.map(a => (
                  <tr key={a.id || a.key} style={{ borderBottom: '1px solid #f1f1f1' }}>
                    <td style={{ padding: '10px 12px', width: 80 }}>
                      <div className="achievement-icon__container" style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: a.icon_url ? 'transparent' : '#efefef', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)', border: '2px solid #000', boxSizing: 'border-box' }}>
                        {a.icon_url ? (
                          <img className="achievement-icon__img" src={a.icon_url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <span style={{ fontSize: 20 }}>🏅</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: 600, textAlign: 'center' }}>{a.name}</td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center' }}>{a.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()
      )}
      <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, gap: 24 }}>
        <Link href="/">
          <button aria-label="Cards" title="Cards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" />
              </svg>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Cards</div>
          </button>
        </Link>
        <Link href="/leaderboards">
          <button aria-label="Leaderboards" title="Leaderboards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Leaderboards</div>
          </button>
        </Link>

        <Link href="/achievements">
          <button aria-label="Achievements" title="Achievements" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Achievements</div>
          </button>
        </Link>
      </div>
      <style>{`
        @media (prefers-color-scheme: dark) {
          .achievements-page .achievement-icon__container { border-color: rgba(255,255,255,0.12) !important; background: transparent !important; }
          .achievements-page .achievement-icon__img { filter: invert(1) brightness(1.6) saturate(1.1); mix-blend-mode: normal; }
          .achievements-page svg path, .achievements-page svg rect, .achievements-page svg circle, .achievements-page svg polygon, .achievements-page svg line { stroke: currentColor !important; fill: currentColor !important; }
          .achievements-page svg { color: #fff !important; }
          .achievements-page { color: #fff; }
        }
      `}</style>
    </div>
  );
}
