"use client";
import React, { useEffect, useState } from "react";
import { getMacroTier, MICRO, macroTiers } from "../../../lib/tiers";
import referenceKey, { normalizeKey, getBand } from '../../../lib/referenceKey';
import SkillHistoryChart from '../../../components/SkillHistoryChart';

interface Props { params: { id: string } }

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v as number;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
function round2(n: number) { return Math.round(n * 100) / 100; }

function computeSessionSkillMap(session: any): Record<string, number> {
  const map: Record<string, number> = {};
  const rows = session?.session_stats ?? [];
  for (const r of rows) {
    const skillType = String(r.skill_type ?? "").trim().toLowerCase();
    if (!skillType) continue;
    if (skillType === 'movement') {
      const tv = toNumber((r as any).t);
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

function getSessionNote(session: any): string | null {
  if (!session) return null;

  const tryExtract = (v: any, depth = 0): string | null => {
    if (v == null) return null;
    if (typeof v === 'string') return v.trim() || null;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) {
      const parts: string[] = [];
      for (const it of v) {
        const s = tryExtract(it, depth + 1);
        if (s) parts.push(s);
      }
      return parts.length ? parts.join('\n') : null;
    }
    if (typeof v === 'object') {
      // common string keys
      const keys = ['note','notes','text','body','comment','comments','notes_text','session_notes','session_note','notesBody','note_text','noteBody'];
      for (const k of keys) {
        if (k in v) {
          const s = tryExtract(v[k], depth + 1);
          if (s) return s;
        }
      }
      // fallback: scan object properties for any string-like content
      for (const k of Object.keys(v)) {
        const s = tryExtract(v[k], depth + 1);
        if (s) return s;
      }
    }
    return null;
  };

  // Try top-level common fields first, then fallback to scanning
  const topCandidates = ['notes', 'note', 'session_notes', 'session_note', 'comments', 'comment', 'notes_text', 'notesBody'];
  for (const k of topCandidates) {
    if (k in session) {
      const s = tryExtract((session as any)[k]);
      if (s) return s;
    }
  }
  // Try other likely places
  if ('session_stats' in session && Array.isArray(session.session_stats)) {
    // sometimes notes are stored in a stats row
    for (const row of session.session_stats) {
      const s = tryExtract(row);
      if (s) return s;
    }
  }
  // final fallback: scan the whole session object shallowly
  return tryExtract(session);
}

export default function PlayerProgressPage({ params }: Props) {
  // `params` may be a Promise in Next client components. Use React.use to unwrap when available.
  const resolvedParams: any = (React as any).use ? (React as any).use(params) : params;
  const id = resolvedParams?.id ?? (params as any)?.id;
  const [player, setPlayer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sessions loaded from Supabase via server API
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // control state for history chart (declare early so Hooks order is stable)
  const [selectedSkill, setSelectedSkill] = useState<string>('Serve');
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  const [sortMode, setSortMode] = useState<'chronological'|'value_asc'|'value_desc'>('chronological');
  const [openNext, setOpenNext] = useState<Record<string, boolean>>({});

  function toggleNext(key: string, comp: string) {
    const k = `${key}:${comp}`;
    setOpenNext((prev) => ({ ...(prev || {}), [k]: !prev[k] }));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // the app exposes a consolidated list endpoint at `/api/players`; fetch and locate by id
        try {
          const res = await fetch('/api/players');
          if (!res.ok) { setError(`Players endpoint returned ${res.status}`); setPlayer(null); setLoading(false); return; }
          const body = await res.json();
          if (cancelled) return;
          // endpoint returns `{ players: [...] }`
          const list = (body && body.players) ? body.players : (Array.isArray(body) ? body : []);
          const found = list.find((pp: any) => String(pp.id) === String(id) || String(pp.player_id) === String(id) || String(pp.id) === String(id).replace(/^player_/, ''));
          if (!found) { setError('Player not found in /api/players response'); setPlayer(null); setLoading(false); return; }
          setPlayer(found);
        } catch (e:any) {
          if (!cancelled) { setError(String(e?.message ?? e)); setPlayer(null); setLoading(false); }
          return;
        }
      } catch (e:any) {
        setError(String(e?.message ?? e));
        setPlayer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // load sessions for this player from the supabase-backed admin endpoint
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!player) return;
      setSessionsLoading(true);
      try {
        const pid = player.id ?? player.player_id ?? player.user_id ?? null;
        if (!pid) {
          setSessions(player.sessions ?? []);
          setSessionsLoading(false);
          return;
        }
        const res = await fetch(`/api/admin/player-sessions?player_id=${encodeURIComponent(String(pid))}`);
        if (!res.ok) {
          // fallback to any embedded sessions on player
          setSessions(player.sessions ?? []);
          setSessionsLoading(false);
          return;
        }
        const body = await res.json();
        if (cancelled) return;
        const list = (body && body.sessions) ? body.sessions : (player.sessions ?? []);
        // ensure descending date order (newest first)
        const sorted = (list || []).slice().sort((a:any,b:any)=>{ const da=a.session_date?new Date(a.session_date):new Date(0); const db=b.session_date?new Date(b.session_date):new Date(0); return db.getTime()-da.getTime(); });
        setSessions(sorted);
      } catch (err) {
        console.error('Failed to load player sessions', err);
        setSessions(player.sessions ?? []);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [player]);

  if (loading) return <div style={{ padding: 20 }}>Loading player...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
  if (!player) return <div style={{ padding: 20 }}>No player data.</div>;

  const skillLabels = ["Serve","Return","Forehand","Backhand","Volley","Overhead","Movement"];
  const compLabelMap: Record<string,string> = { c: 'Consistency', p: 'Power', a: 'Accuracy', s: 'Spin', t: 'Technique' };
  const BAND_BASE_HUES = [0, 28, 52, 140, 200, 270];
  const BAND_BASE_LIGHTNESS = [78, 74, 60, 72, 78, 84];

  function computeBandColor(bandIdx: number, frac = 0.5) {
    const hue = BAND_BASE_HUES[bandIdx] ?? 200;
    const baseL = BAND_BASE_LIGHTNESS[bandIdx] ?? 72;
    const darken = Math.round(Math.min(22, frac * 22));
    const lightness = Math.max(12, Math.min(92, baseL - darken));
    const saturation = 72;
    const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const color = lightness > 56 ? '#111' : '#fff';
    return { background, color };
  }

  function getSkillHeatStyle(skill: string, value: number | null) {
    try {
      if (value === null || value === undefined) return null;
      const sk = normalizeKey(skill);
      const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
      if (!skillEntry) return null;
      const compCandidates = ['consistency', 'technique', 'power', 'accuracy', 'spin'];
      const v = Number(value);
      if (Number.isNaN(v)) return null;
      const vLookup = Math.floor(v);
      for (const comp of compCandidates) {
        const bands = (skillEntry as any)[comp];
        if (!bands || !Array.isArray(bands) || bands.length === 0) continue;
        let bandIdx = bands.findIndex((b: any) => vLookup >= b.min && vLookup <= b.max);
        if (bandIdx === -1) {
          // choose nearest
          try {
            const mids = bands.map((b: any) => ((Number(b.min) + Number(b.max)) / 2));
            let best = 0; let bestDist = Math.abs(v - mids[0]);
            for (let i = 1; i < mids.length; i++) { const d = Math.abs(v - mids[i]); if (d < bestDist) { bestDist = d; best = i; } }
            bandIdx = best;
          } catch (e) { bandIdx = v < bands[0].min ? 0 : bands.length - 1; }
        }
        const band = bands[bandIdx];
        const span = Math.max(1, (band.max - band.min));
        const frac = Math.max(0, Math.min(1, (v - band.min) / span));
        return computeBandColor(bandIdx, frac);
      }
      return computeBandColor(0, 0.5);
    } catch (e) { return null; }
  }

  function getComponentHeatStyle(skill: string, component: string, rawVal: any) {
    try {
      const val = rawVal == null ? null : Number(rawVal);
      if (val === null || Number.isNaN(val)) return null;
      const sk = normalizeKey(skill);
      const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
      if (!skillEntry) return null;
      const compMap: Record<string,string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
      const canonical = compMap[component] || component;
      const bands = (skillEntry as any)[canonical];
      if (!bands || !Array.isArray(bands) || bands.length === 0) return null;
      const vLookup = Math.floor(Number(val));
      let bandIdx = bands.findIndex((b: any) => vLookup >= b.min && vLookup <= b.max);
      if (bandIdx === -1) {
        try {
          const mids = bands.map((b: any) => ((Number(b.min) + Number(b.max)) / 2));
          let best = 0; let bestDist = Math.abs(val - mids[0]);
          for (let i = 1; i < mids.length; i++) { const d = Math.abs(val - mids[i]); if (d < bestDist) { bestDist = d; best = i; } }
          bandIdx = best;
        } catch (e) { bandIdx = val < bands[0].min ? 0 : bands.length - 1; }
      }
      const band = bands[bandIdx];
      const span = Math.max(1, (band.max - band.min));
      const frac = Math.max(0, Math.min(1, (val - band.min) / span));
      return computeBandColor(bandIdx, frac);
    } catch (e) { return null; }
  }

  function getNextBand(skill: string, component: string, rawVal: any) {
    try {
      const val = rawVal == null ? 0 : Number(rawVal);
      const sk = normalizeKey(skill);
      const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
      if (!skillEntry) return null;
      const compMap: Record<string,string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
      const canonical = compMap[component] || component;
      const bands = (skillEntry as any)[canonical];
      if (!bands || !Array.isArray(bands) || bands.length === 0) return null;
      const vLookup = Math.floor(Number(val));
      let idx = bands.findIndex((b: any) => vLookup >= b.min && vLookup <= b.max);
      if (idx === -1) {
        // find insertion point
        idx = bands.findIndex((b: any) => vLookup < b.min) - 1;
        if (idx < 0) idx = bands.length - 1;
      }
      const next = bands[idx + 1] ?? null;
      if (!next) return null;
      return { ...next };
    } catch (e) { return null; }
  }
  // `sessions` comes from supabase via `/api/admin/player-sessions` and is stored in state above

  let recentMap: Record<string, number> | null = null;
  let prevMap: Record<string, number> | null = null;
  if (sessions.length >= 1) recentMap = computeSessionSkillMap(sessions[0]);
  if (sessions.length >= 2) prevMap = computeSessionSkillMap(sessions[1]);

  // compute per-session per-skill component aggregates (c,p,a,s,t)
  function computeSessionComponents(session: any) {
    const out: Record<string, Record<string, number[]>> = {};
    const rows = session?.session_stats ?? [];
    for (const r of rows) {
      const skill = String(r.skill_type ?? '').trim().toLowerCase();
      if (!skill) continue;
      if (!out[skill]) out[skill] = {};
      const comps = ['c','p','a','s','t'];
      for (const k of comps) {
        const v = toNumber((r as any)[k]);
        if (v === null) continue;
        if (!out[skill][k]) out[skill][k] = [];
        out[skill][k].push(v);
      }
    }
    // average arrays
    const avgOut: Record<string, Record<string, number>> = {};
    for (const sk of Object.keys(out)) {
      avgOut[sk] = {};
      for (const k of Object.keys(out[sk])) {
        const arr = out[sk][k];
        avgOut[sk][k] = round2(arr.reduce((a,b)=>a+b,0)/arr.length);
      }
    }
    return avgOut;
  }

  // build history arrays chronological (oldest -> newest)
  const perSkillHistory: Record<string, number[]> = {};
  const perSkillComponentsHistory: Record<string, Array<Record<string, number>>> = {};
  if (sessions.length > 0) {
    const rev = sessions.slice().reverse();
    for (const s of rev) {
      const map = computeSessionSkillMap(s);
      const comps = computeSessionComponents(s);
      for (const lbl of skillLabels) {
        const key = lbl.toLowerCase();
        if (!perSkillHistory[key]) perSkillHistory[key] = [];
        perSkillHistory[key].push(map[key] ?? 0);
        if (!perSkillComponentsHistory[key]) perSkillComponentsHistory[key] = [];
        perSkillComponentsHistory[key].push(comps[key] ?? {});
      }
    }
  }


  // compute overall rating and level progress from avg_rating if present
  const avg = player.avg_rating ?? player.rating ?? 0;
  const ratingNum = typeof avg === 'number' ? avg : Number(avg) || 0;
  const level = Math.floor(Math.max(0, ratingNum) / MICRO);
  const levelStart = level * MICRO;
  const levelProgressPct = Math.max(0, Math.min(100, ((ratingNum - levelStart) / MICRO) * 100));
  const macro = getMacroTier(ratingNum);
  const nextMacro = macroTiers[macro.index + 1] ?? macro;

  return (
    <div style={{ padding: 16, maxWidth: 920 }}>
      <a href="/" style={{ display: 'inline-block', marginBottom: 12 }}>← Back</a>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: '#efefef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {player.avatar_url ? <img src={player.avatar_url} alt="avatar" style={{ width: 64, height: 64, objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#8E8E8E' }} />}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{player.first_name ?? ''} {player.last_name ?? ''}</div>
          <div title="Court Sense Rating" style={{ fontSize: 13, color: '#666' }}>{macro.name} — {Number.isFinite(ratingNum) ? `${ratingNum.toFixed(1)} CSR` : `${ratingNum} CSR`} ({Math.round(levelProgressPct)}% towards {nextMacro.name})</div>
        </div>
      </div>

          <section style={{ marginBottom: 18 }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Skill summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {skillLabels.map((label) => {
                const key = label.toLowerCase();
                const history = perSkillHistory[key] ?? [];
                const latest = history.length ? history[history.length - 1] : null;
                const prev = history.length > 1 ? history[history.length - 2] : null;
                const delta = (latest !== null && prev !== null) ? round2((latest as number) - (prev as number)) : null;
                const band = latest !== null ? getBand(label, 'overall', latest as number) : null;
                const compsLatest = (perSkillComponentsHistory[key] && perSkillComponentsHistory[key].length) ? perSkillComponentsHistory[key][perSkillComponentsHistory[key].length - 1] : {};

                const compsForSkill = key === 'movement' ? ['t'] : ['c','p','a','s','t'];

                const heat = getSkillHeatStyle(label, latest as number | null);
                return (
                  <div key={key} style={{ paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10, border: '1px solid var(--border)', borderRadius: 8, background: heat?.background ?? 'var(--card-bg)', color: heat?.color ?? '#111' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                        {band ? <div title={`${band.name}: ${band.description || ''}`} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: heat?.background ?? 'rgba(0,0,0,0.04)', color: heat?.color ?? '#111', display: 'inline-block', marginTop: 6 }}>{band.name}</div> : null}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{latest !== null ? String(latest) : '—'}</div>
                        {delta !== null && <div style={{ fontSize: 12, color: delta > 0 ? '#16a34a' : (delta < 0 ? '#dc2626' : '#666') }}>{delta > 0 ? `+${delta}` : `${delta}`}</div>}
                      </div>
                    </div>

                    {/* sparkline removed — not needed */}

                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {compsForSkill.map((comp) => {
                        const val = compsLatest ? (compsLatest[comp] ?? null) : null;
                        const bandObj = (val !== null && val !== undefined) ? getBand(label, comp, Number(val)) : null;
                        const compHeat = getComponentHeatStyle(label, comp, val);
                        const nextBand = getNextBand(label, comp, val);
                        const sameHeat = !!(heat?.background && compHeat?.background && heat.background === compHeat.background);
                        const chipBorder = sameHeat ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.04)';
                        return (
                          <div key={comp} title={bandObj ? `${bandObj.name}: ${bandObj.description || ''}` : ''} style={{ fontSize: 11, paddingTop: 8, paddingRight: 10, paddingBottom: 8, paddingLeft: 10, borderRadius: 6, background: compHeat?.background ?? 'rgba(0,0,0,0.02)', border: chipBorder, color: compHeat?.color ?? '#111', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontWeight: 700 }}>{compLabelMap[comp] ?? comp}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {bandObj ? <div style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: compHeat?.background ?? 'rgba(0,0,0,0.04)', color: compHeat?.color ?? '#111' }}>{bandObj.name}</div> : null}
                                    <div style={{ fontWeight: 800 }}>{val !== null ? String(val) : '—'}</div>
                                  </div>
                                </div>
                                {bandObj && bandObj.description ? (
                                  <div style={{ fontSize: 11, color: '#666', marginTop: 6, overflowWrap: 'anywhere' }}>{bandObj.description}</div>
                                ) : null}
                                {nextBand && openNext?.[`${key}:${comp}`] ? (
                                  <div style={{ fontSize: 11, color: '#444', marginTop: 8 }}>
                                    <div style={{ fontWeight: 700 }}>Next: {nextBand.name} (≥{nextBand.min})</div>
                                    <div style={{ fontSize: 11, color: '#666' }}>{nextBand.description}</div>
                                    {nextBand.anchors && nextBand.anchors.length ? (
                                      <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                                        {nextBand.anchors.map((a: any, ai: number) => <li key={ai} style={{ marginBottom: 4 }}>{a}</li>)}
                                      </ul>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                              {nextBand ? (
                                <div onClick={() => toggleNext(key, comp)} title="Show next" aria-label={`toggle next ${comp}`} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6, background: 'rgba(0,0,0,0.06)', color: '#333', fontSize: 12, paddingTop: 6, paddingRight: 8, paddingBottom: 6, paddingLeft: 8, boxSizing: 'border-box', border: '1px solid rgba(0,0,0,0.04)', marginLeft: 8 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, lineHeight: 1 }}>
                                    <div style={{ fontSize: 14 }}>{openNext?.[`${key}:${comp}`] ? '▾' : '▸'}</div>
                                    <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontSize: 11, color: '#444', userSelect: 'none', padding: '0 1px', lineHeight: 1, whiteSpace: 'nowrap' }}>Next level</div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

      <section style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Personalized insights</h3>
        {(() => {
          // analyze recentMap and perSkillComponentsHistory to produce short, actionable insights
          const notes: string[] = [];
          if (!recentMap) {
            notes.push('No recent session data available to generate insights.');
            return <div style={{ color: '#666' }}>{notes[0]}</div>;
          }

          // Skill strengths / weaknesses
          const skills = Object.keys(recentMap);
          const skillPairs = skills.map(s => ({ k: s, v: recentMap[s] ?? 0 }));
          skillPairs.sort((a,b)=>b.v-a.v);
          const top = skillPairs.slice(0,2).map(x=>`${x.k} (${x.v})`);
          const bottom = skillPairs.slice(-2).map(x=>`${x.k} (${x.v})`);
          notes.push(`Your strongest areas recently: ${top.join(', ')}.`);
          notes.push(`Areas to prioritize: ${bottom.join(', ')}.`);

          // component averages from latest session components
          const comps = ['c','p','a','s','t'];
          const latestComps: Record<string, number[]> = {};
          for (const k of Object.keys(perSkillComponentsHistory)) {
            const arr = perSkillComponentsHistory[k];
            if (!arr || !arr.length) continue;
            const latest = arr[arr.length-1] || {};
            for (const c of comps) {
              const v = latest[c];
              if (v === undefined || v === null) continue;
              if (!latestComps[c]) latestComps[c]=[];
              latestComps[c].push(Number(v));
            }
          }
          const compAvgs: Record<string, number> = {};
          for (const c of comps) {
            const arr = latestComps[c] || [];
            compAvgs[c] = arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10 : 0;
          }

          // Determine play style heuristics
          const power = compAvgs['p'] ?? 0;
          const accuracy = compAvgs['a'] ?? 0;
          const consistency = compAvgs['c'] ?? 0;
          let style = 'Balanced';
          if (power >= 55 && accuracy <= power - 8) style = 'Aggressive (power-first)';
          else if (accuracy >= 55 && power <= accuracy - 8) style = 'Control-oriented (accuracy-first)';
          else if ((consistency >= 60) && (power < 50) && (accuracy < 50)) style = 'Steady / Rallying';
          notes.push(`Playing style: ${style}.`);

          // Recommendations based on component lows
          const recs: string[] = [];
          if (consistency && consistency < 50) recs.push('Work on consistency drills: repetitive, target-based rallying to reduce unforced errors.');
          if (power && power < 45) recs.push('Add power development: strength/power training and contact-point timing work.');
          if (accuracy && accuracy < 50) recs.push('Improve accuracy with target practice and point-placement drills.');
          if ((compAvgs['s'] ?? 0) < 40) recs.push('Spin/control: practice spin management and variable bounce drills.');
          if ((compAvgs['t'] ?? 0) < 45) recs.push('Technique: review fundamentals, footwork, and stroke mechanics with a coach.');
          if (!recs.length) recs.push('Maintain well-rounded practice: mix technical, physical, and tactical drills to continue progress.');

          return (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                {notes.map((n, i) => <div key={i} style={{ marginBottom: 6 }}>{n}</div>)}
              </div>
              <div style={{ width: 360, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Recommendations</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {recs.map((r, i) => <li key={i} style={{ marginBottom: 6 }}>{r}</li>)}
                </ul>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Skill movement details have been consolidated into the Skill summary above */}

      <section style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Interactive history</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13 }}>Skill:</label>
          <select value={selectedSkill} onChange={(e)=>setSelectedSkill(e.target.value)}>
            {skillLabels.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{ fontSize: 13 }}>Metric:</label>
          <select value={selectedMetric} onChange={(e)=>setSelectedMetric(e.target.value)}>
            <option value="overall">Overall</option>
            <option value="c">Consistency (C)</option>
            <option value="p">Power (P)</option>
            <option value="a">Accuracy (A)</option>
            <option value="s">Spin (S)</option>
            <option value="t">Technique (T)</option>
          </select>
          <label style={{ fontSize: 13 }}>Sort:</label>
          <select value={sortMode} onChange={(e)=>setSortMode(e.target.value as any)}>
            <option value="chronological">Chronological</option>
            <option value="value_asc">Sort by value ↑</option>
            <option value="value_desc">Sort by value ↓</option>
          </select>
        </div>

        {/* build values array for chart based on selection and sort */}
        {(() => {
          const key = selectedSkill.toLowerCase();
          // compose array of {date?, value}
          const rawChron = (sessions.slice().reverse()).map((s:any, idx:number) => ({ date: s.session_date, map: computeSessionSkillMap(s), comps: computeSessionComponents(s) }));
        interface RawChronItem {
            date?: string;
            map: Record<string, number>;
            comps: Record<string, any>;
        }
        interface ValuePoint { date?: string; value: number; }

        let arr: ValuePoint[] = rawChron.map((r: RawChronItem) => {
            const v = selectedMetric === 'overall'
                ? (r.map[key] ?? 0)
                : ((r.comps && r.comps[selectedMetric]) ? (r.comps[selectedMetric] as any) : (r.map[key] ?? 0));
            return { date: r.date, value: Number.isFinite(Number(v)) ? Number(v) : 0 };
        });
          if (sortMode === 'value_asc') arr = arr.slice().sort((a,b)=>a.value-b.value);
          else if (sortMode === 'value_desc') arr = arr.slice().sort((a,b)=>b.value-a.value);

          return (
            <div>
              <SkillHistoryChart skill={selectedSkill} values={arr} metric={selectedMetric} width={760} height={240} />
            </div>
          );
        })()}
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Sessions & notes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.length === 0 ? (
            <div style={{ color: '#666' }}>No sessions available.</div>
          ) : sessions.map((s:any, idx:number) => {
            const note = getSessionNote(s);
            const dateLabel = s.session_date ? (new Date(s.session_date)).toLocaleString() : (s.date ? (new Date(s.date)).toLocaleString() : `Session ${idx+1}`);
            return (
              <div key={s.id ?? idx} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700 }}>{dateLabel}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{s.coach ?? s.trainer ?? ''}</div>
                </div>
                {note ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13 }}>{note}</pre>
                ) : (
                  <div style={{ color: '#666', fontSize: 13 }}>No notes for this session.</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
