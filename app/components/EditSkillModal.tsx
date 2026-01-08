'use client';
import React, { useState } from 'react';

export default function EditSkillModal({
  open,
  onClose,
  playerName,
  skill,
  sessionId,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  playerName?: string;
  skill: string;
  sessionId?: string | null;
  initial?: { c?: any; p?: any; a?: any; s?: any; t?: any } | null;
  onSaved?: () => void;
}) {
  const [vals, setVals] = useState<{ c?: string; p?: string; a?: string; s?: string; t?: string }>(() => ({
    c: initial?.c ?? '', p: initial?.p ?? '', a: initial?.a ?? '', s: initial?.s ?? '', t: initial?.t ?? ''
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function updateField(k: 'c'|'p'|'a'|'s'|'t', v: string) {
    setVals((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    setError(null);
    if (!sessionId) {
      alert('No session selected to edit.');
      return;
    }
    setLoading(true);
    try {
      const row = { skill_type: skill, c: vals.c === '' ? null : Number(vals.c), p: vals.p === '' ? null : Number(vals.p), a: vals.a === '' ? null : Number(vals.a), s: vals.s === '' ? null : Number(vals.s), t: vals.t === '' ? null : Number(vals.t) };
      const res = await fetch('/api/admin/update-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, stats_components: [row] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save');
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: 520, maxWidth: '96%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>{playerName}</div>
            <div style={{ color: '#6b7280' }}>{skill}</div>
          </div>
          <div>
            <button onClick={onClose} style={{ padding: '6px 10px' }}>Close</button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {(['c','p','a','s','t'] as const).map((k) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 12, color: '#6b7280' }}>{k.toUpperCase()}</label>
              <input value={(vals as any)[k] ?? ''} onChange={(e) => updateField(k, e.target.value)} style={{ padding: 8 }} />
            </div>
          ))}
        </div>

        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={() => { setVals({ c: initial?.c ?? '', p: initial?.p ?? '', a: initial?.a ?? '', s: initial?.s ?? '', t: initial?.t ?? '' }); }} style={{ padding: '8px 12px' }} disabled={loading}>Reset</button>
          <button onClick={save} style={{ padding: '8px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4 }} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
