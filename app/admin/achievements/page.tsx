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

  // helper to create a safe slug/key from the name
  function slugifyName(s: string) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }

  // auto-generate key from name + skill + component + top_n when creating
  useEffect(() => {
    if (editingId) return; // preserve existing key while editing
    const base = `${form.name || ''} ${form.skill || ''} ${form.component || ''} ${form.top_n || ''}`;
    const k = slugifyName(base);
    if (k && k !== form.key) setForm(prev => ({ ...prev, key: k }));
  }, [form.name, form.skill, form.component, form.top_n, editingId]);

  async function createAchievement(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    if (editingId) return updateAchievement();
    console.log('Creating...');
    setIsSubmitting(true);
    try {
      const payload = { key: form.key, name: form.name, description: form.description, rule_type: 'top_by_skill', rule_payload: { skill: form.skill, component: form.component, top_n: Number(form.top_n) }, icon_url: form.icon_url };
      console.log('Creating achievement payload:', payload);
      const res = await fetch('/api/admin/achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json().catch(()=>null);
      console.log('Create response:', res.status, j);
      if (!res.ok) {
        // surface duplicate-key clearly
        const msg = (j && j.error) ? j.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      console.log('Created');
      setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' });
      setEditingId(null);
      await fetchList();
    } catch (err:any) {
      console.error('createAchievement error', err);
    }
    finally { setIsSubmitting(false); }
  }

  async function updateAchievement() {
    if (!editingId) return (console.error('No achievement selected'), void 0);
    console.log('Saving...');
    try {
      const payload = { key: form.key, name: form.name, description: form.description, rule_type: 'top_by_skill', rule_payload: { skill: form.skill, component: form.component, top_n: Number(form.top_n) }, icon_url: form.icon_url };
      console.log('Updating achievement', editingId, payload);
      const res = await fetch(`/api/admin/achievements/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json().catch(()=>null);
      console.log('Update response:', res.status, j);
      if (!res.ok) throw new Error((j && j.error) ? j.error : `HTTP ${res.status}`);
      console.log('Saved');
      setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' });
      setEditingId(null);
      await fetchList();
    } catch (err:any) {
      console.error('updateAchievement error', err);
    }
  }

  async function deleteAchievement(id:number) {
    if (!confirm('Delete this achievement? This cannot be undone.')) return;
    console.log('Deleting...');
    try {
      const res = await fetch(`/api/admin/achievements/${id}`, { method: 'DELETE' });
      const j = await res.json().catch(()=>null);
      console.log('Delete response:', res.status, j);
      if (!res.ok) throw new Error((j && j.error) ? j.error : `HTTP ${res.status}`);
      console.log('Deleted');
      if (editingId === id) { setEditingId(null); setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' }); }
      await fetchList();
    } catch (err:any) { console.error('deleteAchievement error', err); }
  }

  async function runComputeAll() {
    console.log('Computing (all)...');
    try {
      const res = await fetch('/api/admin/compute-achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'all' }) });
      const j = await res.json();
      console.log('Compute all response:', j);
      fetchList();
    } catch (e) { console.error('runComputeAll error', e); }
  }

  

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin"><button type="button">Back to Admin</button></Link>
        <h2 style={{ margin: 0 }}>Achievements (Admin)</h2>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* button styles */}
          <form onSubmit={createAchievement} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Achievement Title</label>
              <input placeholder="Eg. Big Returner" value={form.name} onChange={(e)=>{
                const name = e.target.value;
                setForm(prev => ({ ...prev, name, key: (!prev.key ? slugifyName(name) : prev.key) }));
              }} style={{ width: '100%', padding: '8px 10px' }} />
              

              
            </div>

            
            <div style={{ marginTop: 12 }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
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

              <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6', marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Component</label>
                <select value={form.component} onChange={(e)=>setForm({...form, component: e.target.value})} style={{ padding: '8px 10px' }}>
                  <option value="c">C</option>
                  <option value="p">P</option>
                  <option value="a">A</option>
                  <option value="s">S</option>
                  <option value="t">T</option>
                </select>
              </div>

              <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6', marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Top Players Awarded</label>
                <input placeholder="Top N" value={form.top_n} onChange={(e)=>setForm({...form, top_n: e.target.value})} style={{ width: 120, padding: '8px 10px' }} />
              </div>

              <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6', marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Icon URL (optional)</label>
                <input placeholder="Icon URL (optional)" value={form.icon_url} onChange={(e)=>setForm({...form, icon_url: e.target.value})} style={{ width: '100%', padding: '8px 10px' }} />
              </div>

              <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6', marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</label>
                <textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '8px 10px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ padding: '6px 10px', fontSize: 13, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{editingId ? 'Save Achievement' : 'Create Achievement'}</button>
              <button type="button" onClick={()=>{ setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' }); }} style={{ padding: '6px 10px', fontSize: 13, background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>Clear</button>
              {editingId && <button type="button" onClick={()=>{ setEditingId(null); setForm({ key: '', name: '', description: '', skill: '', component: 'c', top_n: '1', icon_url: '' }); }} style={{ padding: '6px 10px', fontSize: 13, background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel Edit</button>}
            </div>
          </form>
        </div>

        <div style={{ width: 420 }}>
          <div style={{ marginTop: 12 }}>
            <h3>Existing achievements</h3>
            {loading && <div>Loading...</div>}
            {!loading && (!achievements || achievements.length === 0) && <div>No achievements found.</div>}
            {!loading && achievements && achievements.length > 0 && (
              <ul>
                {achievements.map((a)=> (
                  <li key={a.id || a.key} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 6, background: '#fafafa', border: '1px solid #eee' }}>
                    <div>
                      <strong>{a.name}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => {
                        // populate form for editing
                        try {
                          const payload = a.rule_payload || {};
                          setForm({ key: a.key || '', name: a.name || '', description: a.description || '', skill: payload.skill || '', component: payload.component || 'c', top_n: String(payload.top_n || 1), icon_url: a.icon_url || '' });
                          setEditingId(a.id || null);
                          console.log('Editing');
                        } catch (err) { console.error(err); }
                      }}>Edit</button>
                      <button onClick={() => deleteAchievement(a.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={runComputeAll} style={{ padding: '6px 10px', fontSize: 13, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Apply to Player Cards</button>
          </div>
        </div>
      </div>
    </div>
  );
}
