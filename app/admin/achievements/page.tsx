// Cleaned achievements admin page (single-column, max-width 393px)
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [skills, setSkills] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/achievements');
      const json = await res.json();
      setAchievements(json.achievements || []);
    } catch (e) {
      setAchievements([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchList(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/skill-types');
        const j = await res.json();
        if (res.ok && Array.isArray(j.skills)) setSkills(j.skills);
        else setSkills([]);
      } catch (e) { setSkills([]); }
    })();
  }, []);

  function slugifyName(s: string) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }

  useEffect(() => {
    if (editingId) return;
    const base = `${form.name || ''} ${form.skill || ''} ${form.component || ''} ${form.top_n || ''}`;
    const k = slugifyName(base);
    if (k && k !== form.key) setForm(prev => ({ ...prev, key: k }));
  }, [form.name, form.skill, form.component, form.top_n, editingId]);

  async function createAchievement(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    if (editingId) return updateAchievement();
    setIsSubmitting(true);
    try {
      const payload = { key: form.key, name: form.name, description: form.description, rule_type: 'top_by_skill', rule_payload: { skill: form.skill, component: form.component, top_n: Number(form.top_n) }, icon_url: form.icon_url };
      const res = await fetch('/api/admin/achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Create failed');
      setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' });
      setEditingId(null);
      await fetchList();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  }

  async function updateAchievement() {
    if (!editingId) return;
    try {
      const payload = { key: form.key, name: form.name, description: form.description, rule_type: 'top_by_skill', rule_payload: { skill: form.skill, component: form.component, top_n: Number(form.top_n) }, icon_url: form.icon_url };
      const res = await fetch(`/api/admin/achievements/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Update failed');
      setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' });
      setEditingId(null);
      await fetchList();
    } catch (err) { console.error(err); }
  }

  async function deleteAchievement(id:number) {
    if (!confirm('Delete this achievement? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/achievements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      if (editingId === id) { setEditingId(null); setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' }); }
      await fetchList();
    } catch (err) { console.error(err); }
  }

  async function runComputeAll() {
    try {
      await fetch('/api/admin/compute-achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'all' }) });
      fetchList();
    } catch (e) { console.error(e); }
  }

  return (
    <div className="admin-achievements-page" style={{ padding: '48px 16px 92px', position: 'relative' }}>
      <div className="achievements-header" style={{ textAlign: 'center', position: 'relative', paddingTop: 4, paddingBottom: 4 }}>
        <h2 style={{ margin: 0 }}>ACHIEVEMENTS</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 393, marginTop: 12 }}>
        <form onSubmit={createAchievement} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="achievement-field" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Achievement Title</label>
            <input placeholder="Eg. Big Returner" value={form.name} onChange={(e)=>{ const name = e.target.value; setForm(prev => ({ ...prev, name, key: (!prev.key ? slugifyName(name) : prev.key) })); }} style={{ width: '100%', padding: '8px 10px' }} />
          </div>

          <div className="achievement-field" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Skill</label>
            {skills === null ? (
              <div style={{ fontSize: 13, color: '#374151' }}>Loading skills…</div>
            ) : skills.length === 0 ? (
              <input placeholder="Skill (e.g. Serve)" value={form.skill} onChange={(e)=>setForm({...form, skill: e.target.value})} style={{ width: '100%', padding: '8px 10px' }} />
            ) : (
              <select value={form.skill} onChange={(e)=>setForm({...form, skill: e.target.value})} style={{ padding: '8px 10px', width: '100%' }}>
                <option value="">-- select skill --</option>
                {skills.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          <div className="achievement-field" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Component</label>
            <select value={form.component} onChange={(e)=>setForm({...form, component: e.target.value})} style={{ padding: '8px 10px' }}>
              <option value="c">C</option>
              <option value="p">P</option>
              <option value="a">A</option>
              <option value="s">S</option>
              <option value="t">T</option>
            </select>
          </div>

          <div className="achievement-field" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Top Players Awarded</label>
            <input placeholder="Top N" value={form.top_n} onChange={(e)=>setForm({...form, top_n: e.target.value})} style={{ width: 120, padding: '8px 10px' }} />
          </div>

          <div className="achievement-field" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Icon URL (optional)</label>
            <input placeholder="Icon URL (optional)" value={form.icon_url} onChange={(e)=>setForm({...form, icon_url: e.target.value})} style={{ width: '100%', padding: '8px 10px' }} />
          </div>

          <div className="achievement-field" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</label>
            <textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '8px 10px' }} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '6px 10px', fontSize: 13, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{editingId ? 'Save Achievement' : 'Create Achievement'}</button>
            <button type="button" onClick={()=>{ setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' }); }} style={{ padding: '6px 10px', fontSize: 13, background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>Clear</button>
            {editingId && <button type="button" onClick={()=>{ setEditingId(null); setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' }); }} style={{ padding: '6px 10px', fontSize: 13, background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel Edit</button>}
          </div>

        </form>

        <div>
          <h3>Existing achievements</h3>
          {loading && <div>Loading...</div>}
          {!loading && (!achievements || achievements.length === 0) && <div>No achievements found.</div>}
          {!loading && achievements && achievements.length > 0 && (
            <ul>
              {achievements.map((a)=> (
                <li key={a.id || a.key} className="achievement-item" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 6, background: '#fafafa', border: '1px solid #eee' }}>
                  <div><strong>{a.name}</strong></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                      try {
                        const payload = a.rule_payload || {};
                        setForm({ key: a.key || '', name: a.name || '', description: a.description || '', skill: payload.skill || '', component: payload.component || 'c', top_n: String(payload.top_n || 1), icon_url: a.icon_url || '' });
                        setEditingId(a.id || null);
                      } catch (err) { console.error(err); }
                    }} style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteAchievement(a.id)} style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={runComputeAll} style={{ padding: '6px 10px', fontSize: 13, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Apply to Player Cards</button>
          </div>
        </div>
      </div>

      <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999 }}>
        <div style={{ display: 'flex', width: 393, maxWidth: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
          <Link href="/admin" aria-label="Cards" title="Cards" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" />
              </svg>
            </div>
            <div style={{ fontSize: 11, color: 'inherit' }}>Cards</div>
          </Link>

          <Link href="/admin/leaderboards" aria-label="Leaderboards" title="Leaderboards" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'inherit' }}>
            <svg width="20" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="2" y="6" width="4" height="8" rx="1" fill="currentColor" />
              <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.85" />
              <rect x="16" y="9" width="4" height="5" rx="1" fill="currentColor" opacity="0.7" />
            </svg>
            <div style={{ fontSize: 11, color: 'inherit' }}>Leaderboards</div>
          </Link>

          <Link href="/admin/achievements" aria-label="Achievements" title="Achievements" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'inherit' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1-4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: 'inherit' }}>Achievements</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
