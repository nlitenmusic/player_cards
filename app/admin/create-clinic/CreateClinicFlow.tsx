"use client";

import React, { useEffect, useState, useRef } from 'react';
import BandEditor from '../../components/BandEditor';
import { useRouter, useSearchParams } from 'next/navigation';

type Player = { id: string; first_name?: string; last_name?: string };
type Clinic = { id?: string | null; name?: string; date?: string; draft?: boolean; active?: boolean };

function Step1Component({ clinic, clinicNameDraft, setClinicNameDraft, clinicNameDirty, saving, saveClinicDraft, saveTimer, immediateSaveLock, setStep, router }: { clinic: Clinic; clinicNameDraft: string; setClinicNameDraft: (s:string)=>void; clinicNameDirty: React.MutableRefObject<boolean>; saving: boolean; saveClinicDraft: (next: Partial<Clinic>, options?: { immediate?: boolean }) => Promise<void>; saveTimer: React.MutableRefObject<number | null>; immediateSaveLock: React.MutableRefObject<boolean>; setStep: (n:number)=>void; router: any }) {
  const valid = Boolean((clinicNameDraft && clinicNameDraft.trim()) && (clinic?.date && clinic.date.trim()));
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ margin: 0 }}>Clinic Basics</h2>
        <div style={{ color: '#6b7280' }}>{saving ? 'Saving…' : ''}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#6b7280' }}>Clinic name</label>
        <input value={clinicNameDraft} onChange={(e)=>{ setClinicNameDraft(e.target.value); clinicNameDirty.current = true; }} onBlur={(e)=>{ saveClinicDraft({ name: String(e.target.value) }, { immediate: true }); }} style={{ padding: 8, width: '100%', marginTop:6 }} placeholder="e.g. Saturday Morning Clinic" />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#6b7280' }}>Date</label>
        <input type="date" value={clinic?.date ?? ''} onChange={(e)=>{ saveClinicDraft({ date: e.target.value }); }} style={{ padding: 8, marginTop:6 }} />
      </div>
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
        <div />
        <div>
          <button className="text-btn" onClick={() => { try { router.push('/admin'); } catch(e){ window.location.href='/admin'; } }} style={{ padding: '8px 10px', marginRight: 8 }}>Cancel</button>
          <button disabled={!valid} onClick={() => setStep(2)} style={{ padding: '8px 12px', background: valid ? 'var(--accent)' : '#ddd', color: valid ? '#fff' : '#666', border: 'none', borderRadius: 6 }}>{'Next'}</button>
        </div>
      </div>
    </div>
  );
}

function Step2Component({ available, roster, search, setSearch, addPlayerToRoster, removePlayerFromRoster, setStep }: { available: Player[]; roster: Player[]; search: string; setSearch: (s:string)=>void; addPlayerToRoster: (p:Player)=>Promise<void>; removePlayerFromRoster: (p:Player)=>Promise<void>; setStep: (n:number)=>void }) {
  const filteredAvailable = available.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return ((p.first_name||'').toLowerCase().includes(q) || (p.last_name||'').toLowerCase().includes(q));
  });
  return (
    <div style={{ maxWidth: 900, display: 'flex', gap: 18 }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginTop: 0 }}>Available Players</h3>
        <input placeholder="Search players" value={search} onChange={(e)=>setSearch(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} />
        <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
          {filteredAvailable.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 6px', alignItems: 'center', borderBottom: '1px solid #f1f1f1' }}>
              <div>{(p.first_name||'') + ' ' + (p.last_name||'')}</div>
              <button onClick={() => addPlayerToRoster(p)} style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none' }}>Add</button>
            </div>
          ))}
          {filteredAvailable.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>No players found.</div>}
        </div>
      </div>

      <div style={{ width: 360 }}>
        <h3 style={{ marginTop: 0 }}>Clinic Roster</h3>
        <div style={{ maxHeight: 520, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
          {roster.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 6px', alignItems: 'center', borderBottom: '1px solid #f1f1f1' }}>
              <div>{(p.first_name||'') + ' ' + (p.last_name||'')}</div>
              <button onClick={() => removePlayerFromRoster(p)} style={{ padding: '6px 8px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none' }}>Remove</button>
            </div>
          ))}
          {roster.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>No players added yet.</div>}
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <button className="text-btn" onClick={() => setStep(1)} style={{ padding: '8px 10px' }}>Back</button>
          <button className="text-btn" onClick={() => setStep(3)} style={{ padding: '8px 10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6 }}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default function CreateClinicFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = typeof searchParams?.get === 'function' ? searchParams.get('return_to') : '/admin';

  const [step, setStep] = useState<number>(1);
  const [clinic, setClinic] = useState<Clinic>({});
  const [available, setAvailable] = useState<Player[]>([]);
  const [roster, setRoster] = useState<Player[]>([]);
  const [skillsAvailable, setSkillsAvailable] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [playerAdjustments, setPlayerAdjustments] = useState<Record<string, Record<string, Record<string, number | null>>>>({});
  const [playerOpenMap, setPlayerOpenMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const immediateSaveLock = useRef<boolean>(false);
  const [clinicNameDraft, setClinicNameDraft] = useState<string>('');
  const clinicNameDirty = useRef<boolean>(false);

  async function fetchPlayers() {
    try {
      // players list
      const res = await fetch('/api/players');
      const j = await res.json().catch(()=>null);
      if (res.ok && Array.isArray(j?.players)) {
        const items = j.players.map((p: any) => ({ id: String(p.id), first_name: p.first_name, last_name: p.last_name }));
        setAvailable(items);
      } else {
        setAvailable([]);
      }
    } catch (e) {
      console.error('fetchPlayers players error', e);
      setAvailable([]);
    }

    try {
      const res2 = await fetch('/api/admin/skill-types');
      const j2 = await res2.json().catch(()=>null);
      if (res2.ok && Array.isArray(j2?.skills)) setSkillsAvailable(j2.skills);
      else setSkillsAvailable(["Serve","Return","Forehand","Backhand","Volley","Overhead","Movement"]);
    } catch (e) {
      setSkillsAvailable(["Serve","Return","Forehand","Backhand","Volley","Overhead","Movement"]);
    }

    try {
      const draft = localStorage.getItem('clinic:draft');
      if (draft) {
        const parsed = JSON.parse(draft || '{}');
        if (parsed && typeof parsed === 'object') {
          if (parsed.name) setClinicNameDraft(String(parsed.name));
          setClinic((c) => ({ ...(c||{}), ...(parsed||{}) }));
        }
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { fetchPlayers(); }, []);

    const lastFetchKey = useRef<string | null>(null);
    async function loadLatestStatsForRoster() {
      try {
        if (step !== 4) return;
        if (!clinic?.id) return;
        if (!roster || roster.length === 0) return;
        if (!selectedSkills || selectedSkills.length === 0) return;

        const player_ids = roster.map(r => r.id).join(',');
        const skills_q = selectedSkills.join(',');
        const key = `${clinic.id}|${player_ids}|${skills_q}`;
        if (lastFetchKey.current === key) return;
        lastFetchKey.current = key;

        const next: typeof playerAdjustments = {};

        await Promise.all(roster.map(async (p) => {
          try {
            const statsRes = await fetch('/api/admin/player-latest-stats?player_id=' + encodeURIComponent(p.id));
            const sessionsRes = await fetch('/api/admin/player-sessions?player_id=' + encodeURIComponent(p.id) + '&limit=5');
            let statsJson: any = null;
            let sessionsJson: any = null;
            if (statsRes.ok) statsJson = await statsRes.json().catch(()=>null);
            if (sessionsRes.ok) sessionsJson = await sessionsRes.json().catch(()=>null);

            const statsArray = statsJson?.stats || statsJson?.data || statsJson || null;
            if (Array.isArray(statsArray)) {
              for (const rec of statsArray) {
                const pid = String(p.id);
                const skill = String(rec.skill ?? rec.skill_type ?? rec.skill_name ?? '');
                const comps = ['c','p','a','s','t'];
                if (!next[pid]) next[pid] = {};
                if (!next[pid][skill]) next[pid][skill] = {};
                for (const comp of comps) {
                  const val = (rec as any)[comp];
                  if (typeof val !== 'undefined' && val !== null) next[pid][skill][comp] = val;
                }
              }
            }

            const sessionsArray = sessionsJson?.sessions || sessionsJson?.data || sessionsJson || null;
            if (Array.isArray(sessionsArray)) {
              for (const s of sessionsArray) {
                const pid = String(p.id);
                const metrics = (s.session_stats || s.stats || s.metrics || s.values) || [];
                for (const row of metrics) {
                  const skill = String(row.skill_type ?? row.skill ?? row.skill_name ?? '');
                  if (!skill) continue;
                  if (!next[pid]) next[pid] = {};
                  if (!next[pid][skill]) next[pid][skill] = {};
                  const comps = ['c','p','a','s','t'];
                  for (const compKey of comps) {
                    const val = (row as any)[compKey];
                    if (typeof next[pid][skill][compKey] === 'undefined' || next[pid][skill][compKey] === null) {
                      if (typeof val !== 'undefined' && val !== null) next[pid][skill][compKey] = val;
                    }
                  }
                }
              }
            }
          } catch (e) {
            // per-player fetch error; continue
          }
        }));

        setPlayerAdjustments((prev) => ({ ...(prev||{}), ...(next||{}) }));
      } catch (e) {
        console.error('load latest stats/sessions error', e);
      }
    }

    useEffect(() => { loadLatestStatsForRoster(); }, [step, clinic?.id, JSON.stringify(roster.map(r=>r.id)), JSON.stringify(selectedSkills)]);

  async function performSaveClinic(payload: Partial<Clinic>) {
    setSaving(true);
    try {
      const merged = { ...(clinic || {}), ...(payload || {}) } as Clinic;
      if (!merged?.id && (merged.name || merged.date)) {
        const res = await fetch('/api/admin/clinics', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: merged.name, date: merged.date, draft: true })
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.clinic) setClinic(json.clinic);
        else {
          try { localStorage.setItem('clinic:draft', JSON.stringify(merged)); } catch (e) {}
          setClinic(merged);
        }
      } else {
        try {
          const res = await fetch('/api/admin/clinics', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: merged.id, ...payload }) });
          const json = await res.json().catch(() => null);
          if (res.ok && json?.clinic) setClinic(json.clinic);
          else {
            try { localStorage.setItem('clinic:draft', JSON.stringify(merged)); } catch (e) {}
            setClinic(merged);
          }
        } catch (e) {
          try { localStorage.setItem('clinic:draft', JSON.stringify(merged)); } catch (err) {}
          setClinic(merged);
        }
      }
    } catch (e) {
      console.error('performSaveClinic error', e);
    } finally {
      setSaving(false);
    }
  }

  // saveClinicDraft: when immediate=true, flush immediately; otherwise debounce to avoid interrupting typing
  async function saveClinicDraft(next: Partial<Clinic>, options?: { immediate?: boolean }) {
    const immediate = options?.immediate === true;
    // local optimistic update: avoid overwriting clinic.name while typing
    const nextForClinic = { ...(next || {}) } as Partial<Clinic>;
    if (typeof nextForClinic.name !== 'undefined') delete nextForClinic.name;
    setClinic((c) => ({ ...(c || {}), ...(nextForClinic || {}) }));
    if (typeof next.name !== 'undefined') {
      setClinicNameDraft(String(next.name));
      clinicNameDirty.current = false;
    }
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (immediate) {
      // prevent concurrent immediate saves
      if (immediateSaveLock.current) return;
      immediateSaveLock.current = true;
      try {
        await performSaveClinic(next);
      } finally {
        immediateSaveLock.current = false;
      }
      return;
    }
    // debounce short to keep typing smooth
    saveTimer.current = window.setTimeout(() => {
      performSaveClinic(next).catch(() => {});
      saveTimer.current = null;
    }, 500) as unknown as number;
  }

  async function addPlayerToRoster(p: Player) {
    // optimistic
    setRoster((r) => { if (r.find(x=>x.id===p.id)) return r; return [...r, p]; });
    setAvailable((a) => a.filter(x => x.id !== p.id));
    if (!clinic?.id) await saveClinicDraft({}, { immediate: true });
    try {
      await fetch('/api/admin/clinic-players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinic_id: clinic.id, player_id: p.id, action: 'add' }) });
    } catch (e) {
      console.error('addPlayerToRoster error', e);
    }
  }

  async function removePlayerFromRoster(p: Player) {
    setRoster((r) => r.filter(x => x.id !== p.id));
    setAvailable((a) => { if (a.find(x=>x.id===p.id)) return a; return [...a, p]; });
    try {
      await fetch('/api/admin/clinic-players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinic_id: clinic.id, player_id: p.id, action: 'remove' }) });
    } catch (e) {
      console.error('removePlayerFromRoster error', e);
    }
  }

  // Skills management
  async function saveClinicSkills(nextSkills: string[]) {
    // optimistic
    setSelectedSkills(nextSkills);
    if (!clinic?.id) await saveClinicDraft({}, { immediate: true });
    try {
      await fetch('/api/admin/clinic-skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinic_id: clinic.id, skills: nextSkills }) });
    } catch (e) {
      console.error('saveClinicSkills error', e);
    }
  }

  function setPlayerSkillAdjustment(playerId: string, skill: string, component: string, val: number | null) {
    setPlayerAdjustments((prev) => {
      const next = { ...(prev || {}) };
      next[playerId] = { ...(next[playerId] || {}) };
      next[playerId][skill] = { ...(next[playerId][skill] || {}) };
      next[playerId][skill][component] = val;
      return next;
    });
    // persist
    scheduleSavePlayerSkill(playerId, skill, component, val);
  }

  const playerSkillTimers = useRef<Record<string, Record<string, Record<string, number | null>>>>({});
  function scheduleSavePlayerSkill(playerId: string, skill: string, component: string, val: number | null) {
    if (!playerSkillTimers.current[playerId]) playerSkillTimers.current[playerId] = {};
    if (!playerSkillTimers.current[playerId][skill]) playerSkillTimers.current[playerId][skill] = {};
    const existing = playerSkillTimers.current[playerId][skill][component];
    if (existing) window.clearTimeout(existing);
    const t = window.setTimeout(async () => {
      try {
        if (!clinic?.id) await saveClinicDraft({}, { immediate: true });
        await fetch('/api/admin/clinic-player-skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinic_id: clinic.id, player_id: playerId, skill, component, value: val }) });
      } catch (e) { console.error('save player skill error', e); }
    }, 400);
    playerSkillTimers.current[playerId][skill][component] = t as unknown as number;
  }

  async function finalizeClinic() {
    if (!clinic?.id) {
      // ensure saved first
      await saveClinicDraft({}, { immediate: true });
    }
    try {
      await fetch('/api/admin/clinics', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: clinic.id, active: true, draft: false }) });
      // navigate away to returnTo
      try { router.push(returnTo || '/admin'); } catch (e) { window.location.href = returnTo || '/admin'; }
    } catch (e) {
      console.error('finalizeClinic error', e);
    }
  }

  // Simple Step components inline
  const Step1 = () => {
    const valid = Boolean((clinicNameDraft && clinicNameDraft.trim()) && (clinic?.date && clinic.date.trim()));
    useEffect(()=>{},[]);
    return (
      <div style={{ maxWidth: 720 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin: 0 }}>Clinic Basics</h2>
          <div style={{ color: '#6b7280' }}>{saving ? 'Saving…' : ''}</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#6b7280' }}>Clinic name</label>
          <input value={clinicNameDraft} onChange={(e)=>{ setClinicNameDraft(e.target.value); clinicNameDirty.current = true; }} onBlur={(e)=>{ saveClinicDraft({ name: String(e.target.value) }, { immediate: true }); }} style={{ padding: 8, width: '100%', marginTop:6 }} placeholder="e.g. Saturday Morning Clinic" />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#6b7280' }}>Date</label>
          <input type="date" value={clinic?.date ?? ''} onChange={(e)=>{ saveClinicDraft({ date: e.target.value }); }} style={{ padding: 8, marginTop:6 }} />
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
          <div />
          <div>
            <button className="text-btn" onClick={() => { try { router.push('/admin'); } catch(e){ window.location.href='/admin'; } }} style={{ padding: '8px 10px', marginRight: 8 }}>Cancel</button>
            <button disabled={!valid} onClick={() => setStep(2)} style={{ padding: '8px 12px', background: valid ? 'var(--accent)' : '#ddd', color: valid ? '#fff' : '#666', border: 'none', borderRadius: 6 }}>{'Next'}</button>
          </div>
        </div>
      </div>
    );
  };

  const filteredAvailable = available.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return ((p.first_name||'').toLowerCase().includes(q) || (p.last_name||'').toLowerCase().includes(q));
  });

  // Step2 is implemented as a top-level Step2Component to preserve identity

  // Step 3: Select Skills Practiced
  const Step3 = () => {
    const [skillQuery, setSkillQuery] = useState<string>('');
    const filtered = skillsAvailable.filter(s => s.toLowerCase().includes(skillQuery.trim().toLowerCase()));
    async function gotoAdjustments() {
      if (selectedSkills.length === 0) return; // prevent navigating if no skills
      if (!clinic?.id) await saveClinicDraft({}, { immediate: true });
      setStep(4);
    }
    return (
      <div style={{ maxWidth: 960, display: 'flex', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Clinic Skills</h3>
          <input placeholder="Search skills" value={skillQuery} onChange={(e)=>setSkillQuery(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {selectedSkills.map(s => (
              <div key={s} style={{ padding: '6px 10px', borderRadius: 16, background: '#111', color: '#fff' }}>
                {s} <button onClick={() => saveClinicSkills(selectedSkills.filter(x=>x!==s))} style={{ marginLeft: 8, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
            {filtered.map(s => (
              <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 6px', alignItems: 'center', borderBottom: '1px solid #f1f1f1' }}>
                <div>{s}</div>
                <button onClick={() => saveClinicSkills(Array.from(new Set([...selectedSkills, s])))} style={{ padding: '6px 8px', borderRadius: 6, background: selectedSkills.includes(s) ? '#ccc' : 'var(--accent)', color: '#fff', border: 'none' }}>{selectedSkills.includes(s) ? 'Selected' : 'Add'}</button>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>No skills found.</div>}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <button className="text-btn" onClick={() => setStep(2)} style={{ padding: '8px 10px' }}>Back</button>
            <button className="text-btn" onClick={() => gotoAdjustments()} style={{ padding: '8px 10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6 }}>Next</button>
          </div>
        </div>

        <div style={{ width: 420 }}>
          <h3 style={{ marginTop: 0 }}>Player Adjustments (Preview)</h3>
          <div style={{ maxHeight: 520, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
            {roster.map(p => (
              <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>{(p.first_name||'') + ' ' + (p.last_name||'')}</div>
            ))}
            {roster.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>No players added yet.</div>}
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Player Adjustments (per-player editing, requires skills selected)
  const Step4_Adjustments = () => {
    // player stats/sessions are loaded by the centralized `loadLatestStatsForRoster` effect
    return (
      <div style={{ maxWidth: 960, display: 'flex', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Player Adjustments</h3>
          <div style={{ maxHeight: 720, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
            {roster.map(p => (
              <PlayerSkillAdjustRow
                key={p.id}
                player={p}
                skills={selectedSkills}
                adjustments={playerAdjustments[p.id] || {}}
                open={Boolean(playerOpenMap[p.id])}
                toggleOpen={() => setPlayerOpenMap(prev => ({ ...(prev||{}), [p.id]: !prev[p.id] }))}
                onChange={(skill, component, val) => setPlayerSkillAdjustment(p.id, skill, component, val)}
              />
            ))}
            {roster.length === 0 && <div style={{ padding: 12, color: '#6b7280' }}>No players added yet.</div>}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <button className="text-btn" onClick={() => setStep(3)} style={{ padding: '8px 10px' }}>Back</button>
            <button className="text-btn" onClick={() => setStep(5)} style={{ padding: '8px 10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6 }}>Next</button>
          </div>
        </div>
      </div>
    );
  };

  const Step4 = () => {
    return (
      <div style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Review & Confirm</h2>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700 }}>Clinic</div>
          <div style={{ color: '#6b7280' }}>{clinic?.name || '—'}</div>
          <div style={{ color: '#6b7280', marginTop: 6 }}>{clinic?.date || '—'}</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700 }}>Skills Practiced</div>
          <div style={{ marginTop: 8 }}>
            {selectedSkills.map(s => <div key={s} style={{ padding: '6px 0' }}>{s}</div>)}
            {selectedSkills.length === 0 && <div style={{ color: '#6b7280' }}>No skills selected.</div>}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700 }}>Roster ({roster.length})</div>
          <div style={{ marginTop: 8 }}>
            {roster.map(p => <div key={p.id} style={{ padding: '6px 0' }}>{(p.first_name||'') + ' ' + (p.last_name||'')}</div>)}
            {roster.length === 0 && <div style={{ color: '#6b7280' }}>No players added.</div>}
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
          <button className="text-btn" onClick={() => setStep(3)} style={{ padding: '8px 10px' }}>Back</button>
          <div>
            <button className="text-btn" onClick={() => setStep(5)} style={{ padding: '8px 10px', marginRight: 8 }}>Enter Player Notes (optional)</button>
            <button onClick={() => finalizeClinic()} style={{ padding: '8px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6 }}>Create Clinic</button>
          </div>
        </div>
      </div>
    );
  };

  // Step4: notes; autosave per player
  const Step5 = () => {
    return (
      <div style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Player Notes</h2>
        <div style={{ marginTop: 12 }}>
          {roster.map(p => (
            <PlayerNoteRow key={p.id} player={p} clinicId={clinic?.id} />
          ))}
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
          <button className="text-btn" onClick={() => setStep(3)} style={{ padding: '8px 10px' }}>Back</button>
          <div>
            <button onClick={() => finalizeClinic()} style={{ padding: '8px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6 }}>Finish</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Create Clinic</div>
          <div style={{ color: '#6b7280' }}>Step {step} of 6</div>
        </div>
      </div>
      {step === 1 && <Step1Component clinic={clinic} clinicNameDraft={clinicNameDraft} setClinicNameDraft={setClinicNameDraft} clinicNameDirty={clinicNameDirty} saving={saving} saveClinicDraft={saveClinicDraft} saveTimer={saveTimer} immediateSaveLock={immediateSaveLock} setStep={setStep} router={router} />}
      {step === 2 && <Step2Component available={available} roster={roster} search={search} setSearch={setSearch} addPlayerToRoster={addPlayerToRoster} removePlayerFromRoster={removePlayerFromRoster} setStep={setStep} />}
      {step === 3 && <Step3 />}
      {step === 4 && <Step4_Adjustments />}
      {step === 5 && <Step4 />}
      {step === 6 && <Step5 />}
    </div>
  );
}

function PlayerNoteRow({ player, clinicId }: { player: Player; clinicId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string>('');
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    // load existing note if endpoint available
    let mounted = true;
    (async () => {
      try {
        if (!clinicId) return;
        const res = await fetch('/api/admin/clinic-player-notes?clinic_id=' + encodeURIComponent(String(clinicId)) + '&player_id=' + encodeURIComponent(player.id));
        const json = await res.json().catch(()=>null);
        if (mounted && json?.note) setNote(String(json.note));
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [clinicId, player.id]);

  function scheduleSave(nextNote: string) {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    // debounce short to avoid excessive requests
    saveTimer.current = window.setTimeout(async () => {
      try {
        await fetch('/api/admin/clinic-player-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinic_id: clinicId, player_id: player.id, note: nextNote }) });
      } catch (e) { console.error('save note error', e); }
    }, 400);
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{(player.first_name||'') + ' ' + (player.last_name||'')}</div>
        <button onClick={() => setOpen(o => !o)} style={{ padding: '6px 8px', borderRadius: 6, background: '#eee', border: 'none' }}>{open ? 'Collapse' : 'Add/View Notes'}</button>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          <textarea value={note} onChange={(e)=>{ setNote(e.target.value); scheduleSave(e.target.value); }} placeholder="Quick notes" style={{ width: '100%', minHeight: 80, padding: 8 }} />
        </div>
      )}
    </div>
  );
}

function PlayerSkillAdjustRow({ player, skills, adjustments, onChange, open, toggleOpen }: { player: Player; skills: string[]; adjustments: Record<string, Record<string, number | null>>; onChange: (skill: string, component: string, val: number | null) => void; open: boolean; toggleOpen: ()=>void }) {
  const componentKeys: Array<'c'|'p'|'a'|'s'|'t'> = ['c','p','a','s','t'];
  const componentLabels: Record<string,string> = { c: 'Consistency', p: 'Power', a: 'Accuracy', s: 'Spin', t: 'Technique' };
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{(player.first_name||'') + ' ' + (player.last_name||'')}</div>
        <button onClick={toggleOpen} style={{ padding: '6px 8px', borderRadius: 6, background: '#eee', border: 'none' }}>{open ? 'Collapse' : 'Adjust'}</button>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          {skills.length === 0 && <div style={{ color: '#6b7280' }}>No skills selected for this clinic.</div>}
          {skills.length > 0 && (
            <BandEditor skills={skills} valuesMap={adjustments} onChange={(skill, component, val) => {
              onChange(skill, component, val);
            }} />
          )}
        </div>
      )}
    </div>
  );
}
 

