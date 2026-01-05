'use client';
import React, { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  playerName: string;
  skill: string;
  sessionId?: string;
  initial?: { c?: any; p?: any; a?: any; s?: any; t?: any } | null;
  onSaved?: () => void;
}

export default function EditSkillModal({ open, onClose, playerName, skill, sessionId, initial, onSaved }: Props) {
  const [vals, setVals] = useState({ c: initial?.c ?? '', p: initial?.p ?? '', a: initial?.a ?? '', s: initial?.s ?? '', t: initial?.t ?? '' });
  const [saving, setSaving] = useState(false);

  React.useEffect(()=>{
    setVals({ c: initial?.c ?? '', p: initial?.p ?? '', a: initial?.a ?? '', s: initial?.s ?? '', t: initial?.t ?? '' });
  }, [initial, open]);

  if (!open) return null;

  async function save() {
    if (!sessionId) return alert('Missing session id');
    setSaving(true);
    try {
      const payload = { session_id: sessionId, skill_type: skill, c: vals.c, p: vals.p, a: vals.a, s: vals.s, t: vals.t };
      const res = await fetch('/api/admin/update-session-stat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'save failed');
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('save stat failed', err);
      alert('Failed to save stat');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', width: 720, maxWidth: '95%', background: '#fff', borderRadius: 8, padding: 18, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{playerName}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{skill}</div>
          </div>
          <div>
            <button onClick={onClose} style={{ padding: '6px 10px' }}>Close</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#374151' }}>c</label>
            <input value={vals.c ?? ''} onChange={(e)=>setVals(v=>({ ...v, c: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#374151' }}>p</label>
            <input value={vals.p ?? ''} onChange={(e)=>setVals(v=>({ ...v, p: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#374151' }}>a</label>
            <input value={vals.a ?? ''} onChange={(e)=>setVals(v=>({ ...v, a: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#374151' }}>s</label>
            <input value={vals.s ?? ''} onChange={(e)=>setVals(v=>({ ...v, s: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#374151' }}>t</label>
            <input value={vals.t ?? ''} onChange={(e)=>setVals(v=>({ ...v, t: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 12px' }} disabled={saving}>Cancel</button>
          <button onClick={save} style={{ padding: '8px 12px' }} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
