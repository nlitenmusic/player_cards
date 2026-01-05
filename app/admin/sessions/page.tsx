'use client';
import React, { useEffect, useState } from 'react';
import EditSkillModal from '../../components/EditSkillModal';

interface SessionRow {
  id: string;
  player_id: string;
  player_first_name?: string;
  player_last_name?: string;
  session_date?: string;
  notes?: string | null;
  players?: {
    id?: string;
    first_name?: string;
    last_name?: string;
  };
  session_stats?: any[];
  sessionStats?: any[];
  player?: {
    id?: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const skillLabels = ["Serve","Return","Forehand","Backhand","Volley","Overhead","Movement"]; 
  const [playersBySkill, setPlayersBySkill] = useState<any[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [editingCell, setEditingCell] = useState<{ playerId: string; skill: string; } | null>(null);
  const [editingVals, setEditingVals] = useState<{ c?: any; p?: any; a?: any; s?: any; t?: any; session_id?: string } | null>(null);

  async function load(q = '') {
    setLoading(true);
    try {
      const url = '/api/admin/sessions' + (q ? `?q=${encodeURIComponent(q)}` : '');
      const res = await fetch(url);
      const json = await res.json();
      let rows: any[] = json.sessions || [];
      // apply a local, forgiving filter if query provided — handles full-name matches and minor backend mismatches
      if (q && rows.length) {
        const qq = q.trim().toLowerCase();
        rows = rows.filter((s:any) => {
          const first = (s.players && s.players.first_name) || s.player_first_name || '';
          const last = (s.players && s.players.last_name) || s.player_last_name || '';
          const combined = `${first} ${last}`.toLowerCase();
          const notes = (s.notes || s.notes === '') ? String(s.notes).toLowerCase() : '';
          return first.toLowerCase().includes(qq) || last.toLowerCase().includes(qq) || combined.includes(qq) || notes.includes(qq) || String(s.player_id || '').toLowerCase().includes(qq) || String(s.id || '').toLowerCase().includes(qq);
        });
      }
      setSessions(rows);
      // compute per-player latest-session skill map
      const byPlayer: Record<string, any> = {};
      for (const s of rows) {
        const pid = s.player_id || (s.players && s.players.id) || s.player?.id;
        const pfirst = (s.players && s.players.first_name) || s.player_first_name || '';
        const plast = (s.players && s.players.last_name) || s.player_last_name || '';
        const date = s.session_date ? new Date(s.session_date) : new Date(0);
        if (!pid) continue;
        if (!byPlayer[pid] || new Date(byPlayer[pid].session_date) < date) {
          byPlayer[pid] = { id: pid, first_name: pfirst, last_name: plast, session_date: s.session_date, session_id: s.id, session_stats: s.session_stats || s.sessionStats || [] };
        }
      }

      function toNumber(v: unknown): number | null {
        if (v === null || v === undefined || v === "") return null;
        if (typeof v === 'number') return v as number;
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
      }
      function round2(n: number) { return Math.round(n * 100) / 100; }

      function computeSkillMapFromStats(rowsStats: any[] = []) {
        const map: Record<string, number> = {};
        for (const r of rowsStats) {
          const skillType = String(r.skill_type ?? '').trim().toLowerCase();
          if (!skillType) continue;
          if (skillType === 'movement') {
            const tv = toNumber(r.t);
            if (tv !== null) map[skillType] = round2(tv);
            continue;
          }
          const primaryVals = ['c','p','a','s','t'].map((k) => toNumber((r as any)[k])).filter((n) => n !== null) as number[];
          let rowVal: number | null = null;
          if (primaryVals.length > 0) rowVal = primaryVals.reduce((a,b)=>a+b,0)/primaryVals.length;
          else {
            const other = Object.values(r).map(toNumber).filter((n)=>n!==null) as number[];
            if (other.length===1) rowVal = other[0];
            else if (other.length>1) rowVal = other.reduce((a,b)=>a+b,0)/other.length;
          }
          if (rowVal !== null) map[skillType] = round2(rowVal);
        }
        return map;
      }

      const playersArr = Object.values(byPlayer).map((p:any)=>{
        const skills = computeSkillMapFromStats(p.session_stats || []);
        // ensure all skill labels present
        const normalized: Record<string, number> = {};
        skillLabels.forEach((lab)=>{ normalized[lab.toLowerCase()] = Number(skills[lab.toLowerCase()] ?? 0); });
        return { id: p.id, first_name: p.first_name, last_name: p.last_name, session_date: p.session_date, skills: normalized, session_id: p.session_id || p.id, session_stats: p.session_stats };
      });
      setPlayersBySkill(playersArr);
    } catch (e) {
      console.error('failed to load sessions', e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveNotes(sessionId: string, notes: string | null) {
    setSaving((s) => ({ ...s, [sessionId]: true }));
    try {
      const res = await fetch('/api/admin/update-session-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, notes }),
      });
      const json = await res.json();
      if (res.ok) {
        setSessions((rows) => rows.map((r) => (r.id === sessionId ? { ...r, notes } : r)));
      } else {
        console.error('save notes error', json);
        alert(json?.error || 'Failed to save notes');
      }
    } catch (e) {
      console.error('save notes failed', e);
      alert('Failed to save notes');
    } finally {
      setSaving((s) => ({ ...s, [sessionId]: false }));
    }
  }

  function updateNoteLocal(id: string, val: string) {
    setSessions((rows) => rows.map((r) => (r.id === id ? { ...r, notes: val } : r)));
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin — Sessions</h2>

      <div style={{ margin: '12px 0 18px 0', display: 'flex', gap: 8 }}>
        <input
          placeholder="Search by player name or id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px 12px', minWidth: 320 }}
        />
        <button onClick={() => load(query)} style={{ padding: '8px 12px' }}>Search</button>
        <button onClick={() => { setQuery(''); load(); }} style={{ padding: '8px 12px' }}>Clear</button>
      </div>

      {loading ? (
        <div>Loading sessions…</div>
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>
            <h3>Players — latest session skill components</h3>
            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Player</th>
                    {skillLabels.map((lab) => (
                      <th key={lab} style={{ textAlign: 'right', padding: 8, cursor: 'pointer' }} onClick={() => {
                        if (sortKey === lab.toLowerCase()) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                        else { setSortKey(lab.toLowerCase()); setSortDir('desc'); }
                      }}>{lab}{sortKey === lab.toLowerCase() ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {playersBySkill.slice().sort((a,b)=>{
                    if (!sortKey) return a.first_name.localeCompare(b.first_name);
                    const va = a.skills[sortKey] ?? 0;
                    const vb = b.skills[sortKey] ?? 0;
                    return sortDir === 'desc' ? vb - va : va - vb;
                  }).map((p) => (
                    <tr key={p.id}>
                      <td style={{ padding: 8 }}>{p.first_name} {p.last_name} <div style={{ fontSize: 11, color: '#6b7280' }}>{p.session_date ? new Date(p.session_date).toLocaleString() : ''}</div></td>
                      {skillLabels.map((lab) => {
                        const key = lab.toLowerCase();
                        const val = p.skills[key] ?? 0;
                        return (
                          <td key={lab} style={{ padding: 8, textAlign: 'right', cursor: 'pointer' }} onClick={() => {
                            const session_id = p.session_id;
                            const raw = (p.session_stats || []).find((r:any)=>String(r.skill_type || '').trim().toLowerCase() === key) || {};
                            setEditingCell({ playerId: p.id, skill: key });
                            setEditingVals({ c: raw.c ?? '', p: raw.p ?? '', a: raw.a ?? '', s: raw.s ?? '', t: raw.t ?? '', session_id });
                          }}>
                            <div style={{ minWidth: 40 }}>{val}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingCell && (
            <EditSkillModal
              open={!!editingCell}
              onClose={() => { setEditingCell(null); setEditingVals(null); }}
              playerName={(playersBySkill.find(p=>p.id===editingCell.playerId)?.first_name || '') + ' ' + (playersBySkill.find(p=>p.id===editingCell.playerId)?.last_name || '')}
              skill={editingCell.skill}
              sessionId={editingVals?.session_id}
              initial={{ c: editingVals?.c, p: editingVals?.p, a: editingVals?.a, s: editingVals?.s, t: editingVals?.t }}
              onSaved={() => load(query)}
            />
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {sessions.length === 0 && <div>No sessions found.</div>}
            {sessions.map((s) => (
              <div key={s.id} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{s.player_first_name || (s.players && s.players.first_name) || ''} {(s.player_last_name || (s.players && s.players.last_name) || '')}</div>
                  <div style={{ color: '#6b7280' }}>{s.session_date ? new Date(s.session_date).toLocaleString() : '—'}</div>
                  <div style={{ marginLeft: 'auto', color: '#6b7280' }}>ID: {s.id}</div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <strong>Skill components:</strong>
                  <div style={{ marginTop: 6 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 6 }}>Skill</th>
                          <th style={{ textAlign: 'center', padding: 6 }}>c</th>
                          <th style={{ textAlign: 'center', padding: 6 }}>p</th>
                          <th style={{ textAlign: 'center', padding: 6 }}>a</th>
                          <th style={{ textAlign: 'center', padding: 6 }}>s</th>
                          <th style={{ textAlign: 'center', padding: 6 }}>t</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(s.session_stats || s.sessionStats || []).map((r:any, idx:number)=> (
                          <tr key={idx}>
                            <td style={{ padding: 6 }}>{String(r.skill_type ?? '')}</td>
                            <td style={{ textAlign: 'center', padding: 6 }}>{r.c ?? ''}</td>
                            <td style={{ textAlign: 'center', padding: 6 }}>{r.p ?? ''}</td>
                            <td style={{ textAlign: 'center', padding: 6 }}>{r.a ?? ''}</td>
                            <td style={{ textAlign: 'center', padding: 6 }}>{r.s ?? ''}</td>
                            <td style={{ textAlign: 'center', padding: 6 }}>{r.t ?? ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <textarea
                    value={s.notes ?? ''}
                    onChange={(e) => updateNoteLocal(s.id, e.target.value)}
                    placeholder="Session notes — visible to players"
                    rows={3}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}
                  />
                </div>

                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => saveNotes(s.id, s.notes ?? null)}
                    disabled={!!saving[s.id]}
                    style={{ padding: '8px 12px' }}
                  >
                    {saving[s.id] ? 'Saving…' : 'Save Notes'}
                  </button>
                  <button onClick={() => load()} style={{ padding: '8px 12px' }}>Reload</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
