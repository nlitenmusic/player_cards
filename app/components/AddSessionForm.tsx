'use client';
import React, { useEffect, useState, useRef, useMemo, useImperativeHandle } from "react";
import BandTooltip from "./Leaderboards/BandTooltip";
import referenceKey, { normalizeKey, getBand } from "../lib/referenceKey";

type ComponentKey = 'c' | 'p' | 'a' | 's' | 't';
type ComponentRow = { skill_type: string; c?: number | null; p?: number | null; a?: number | null; s?: number | null; t?: number | null };

type AddSessionFormHandle = {
  getState: () => { rows: ComponentRow[]; date: string; notes: string; selectedSessionId: string | null };
  setState: (s: { rows?: ComponentRow[]; date?: string; notes?: string; selectedSessionId?: string | null }) => void;
  submit: () => Promise<void>;
};

export default React.forwardRef(function AddSessionForm({ player, onClose, onCreated, hideDate, hideNotes, showSaveButton = true, hideDelete = false, readOnly = false }: { player: any; onClose?: () => void; onCreated?: () => void; hideDate?: boolean; hideNotes?: boolean; showSaveButton?: boolean; hideDelete?: boolean; readOnly?: boolean }, ref: React.Ref<AddSessionFormHandle>) {
  const skillLabels = ["Serve", "Return", "Forehand", "Backhand", "Volley", "Overhead", "Movement"];
  const componentKeys: ComponentKey[] = ['c', 'p', 'a', 's', 't'];
  const componentLabels: Record<ComponentKey, string> = {
    c: 'Consistency', p: 'Power', a: 'Accuracy', s: 'Spin', t: 'Technique'
  };

  const [rows, setRows] = useState<ComponentRow[]>(() =>
    skillLabels.map((label) => ({ skill_type: label, c: null, p: null, a: null, s: null, t: null }))
  );
  function todayLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const [date, setDate] = useState<string>(todayLocal());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [notes, setNotes] = useState<string>(player?.notes ?? '');
  const notesRef = useRef<string>(player?.notes ?? '');
  // optional display controls for multi-step flow
  hideDate = hideDate ?? false;
  hideNotes = hideNotes ?? false;
  showSaveButton = showSaveButton ?? true;
  readOnly = readOnly ?? false;
  const [newFirstName, setNewFirstName] = useState<string>(player?.first_name ?? '');
  const [newLastName, setNewLastName] = useState<string>(player?.last_name ?? '');
  const [hoveredBand, setHoveredBand] = useState<{ skill: string; component: string; value: number | null } | null>(null);
  const [sessionsList, setSessionsList] = useState<any[] | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [customQuickFill, setCustomQuickFill] = useState<Record<string, string>>({});

  const showTimeout = useRef<number | null>(null);
  const hideTimeout = useRef<number | null>(null);
  const currentContext = useRef<{ skill: string; component: string; value: number | null } | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalWidth, setModalWidth] = useState<number>(840);
  const inputFontSize = modalWidth <= 480 ? 16 : 11;
  const isMobile = modalWidth <= 480;

  const skillMap = useMemo(() => {
    const map = new Map<string, ComponentRow>();
    rows.forEach(r => map.set(r.skill_type, r));
    return map;
  }, [rows]);

  const [currentSkillIndex, setCurrentSkillIndex] = useState<number>(0);

  function clearShowTimer() {
    if (showTimeout.current) { window.clearTimeout(showTimeout.current); showTimeout.current = null; }
  }
  function clearHideTimer() {
    if (hideTimeout.current) { window.clearTimeout(hideTimeout.current); hideTimeout.current = null; }
  }

  function scheduleShow(ctx: { skill: string; component: string; value: number | null }) {
    clearHideTimer();
    clearShowTimer();
    currentContext.current = ctx;
    showTimeout.current = window.setTimeout(() => {
      try { console.debug('AddSessionForm: scheduleShow -> setHoveredBand', ctx); } catch(e){}
      setHoveredBand(ctx);
      showTimeout.current = null;
    }, 120);
  }

  function scheduleHide(delay = 250) {
    clearShowTimer();
    clearHideTimer();
    hideTimeout.current = window.setTimeout(() => {
      try { console.debug('AddSessionForm: scheduleHide -> clear hoveredBand'); } catch(e){}
      setHoveredBand(null);
      currentContext.current = null;
      hideTimeout.current = null;
    }, delay);
  }

  function handleHover(ctx: { skill: string; component: string; value: number | null } | null) {
    if (ctx) scheduleShow(ctx);
    else scheduleHide();
  }

  useEffect(() => {
    try { console.debug('AddSessionForm: hoveredBand changed', hoveredBand); } catch(e){}
    function updateWidth() {
      const w = modalRef.current?.clientWidth ?? 840;
      setModalWidth(w);
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => { notesRef.current = notes; }, [notes]);

  useEffect(() => {
    return () => {};
  }, []);

  const loadLatest = async () => {
    setError(null);
    setLoadingLatest(true);
    try {
      const res = await fetch(`/api/admin/player-latest-stats?player_id=${player.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load latest stats");
      const data: ComponentRow[] = json?.stats ?? [];
      if (data.length) {
        const norm = data.map((r: any) => ({
          key: String(r.skill_type ?? "").trim().toLowerCase(),
          raw: r,
        }));
        const map: Record<string, any> = {};
        const seen: string[] = [];
        for (const { key, raw } of norm) {
          if (!key) continue;
          if (map[key]) {
            console.warn("Duplicate skill_type from API:", key, raw);
          }
          map[key] = raw;
          seen.push(key);
        }
        const expectedKeys = skillLabels.map((s) => s.toLowerCase());
        const missing = expectedKeys.filter((k) => !seen.includes(k));
        const extras = seen.filter((k) => !expectedKeys.includes(k));
        if (missing.length) console.warn("Missing skill rows for:", missing);
        if (extras.length) console.warn("Unexpected skill rows from DB:", extras);

        setRows(skillLabels.map((label) => {
          const key = label.toLowerCase();
          const r = map[key];
          return {
            skill_type: label,
            c: r?.c ?? null,
            p: r?.p ?? null,
            a: r?.a ?? null,
            s: r?.s ?? null,
            t: r?.t ?? null,
          };
        }));
        if (json.notes) setNotes(String(json.notes));
      } else {
        setError("No previous session stats found for this player");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingLatest(false);
    }
  };

  const loadSessionsList = async () => {
    if (!player?.id) return;
    try {
      const res = await fetch(`/api/admin/player-sessions?player_id=${player.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'failed to load sessions');
      setSessionsList(json.sessions || []);
    } catch (err) {
      console.error('loadSessionsList error', err);
      setSessionsList([]);
    }
  };

  const loadSessionById = (sessionId: any) => {
    if (!sessionsList) return;
    const s = sessionsList.find((x:any)=>String(x.id) === String(sessionId));
    if (!s) return;
    const rowsMap: Record<string, any> = {};
    for (const r of (s.session_stats||[])) {
      const key = String(r.skill_type||'').trim().toLowerCase();
      rowsMap[key] = r;
    }
    setRows(skillLabels.map(label => {
      const k = label.toLowerCase();
      const r = rowsMap[k];
      return { skill_type: label, c: r?.c ?? null, p: r?.p ?? null, a: r?.a ?? null, s: r?.s ?? null, t: r?.t ?? null };
    }));
    if (s.session_date) setDate(String(s.session_date).slice(0,10));
    if (s.notes) setNotes(String(s.notes));
    setSelectedSessionId(String(s.id));
  };

  const handleDateChange = (nextDate: string) => {
    setDate(nextDate);
    if (!sessionsList) return;
    const found = sessionsList.find((x:any)=>String(x.session_date).slice(0,10) === String(nextDate));
    if (found) {
      loadSessionById(found.id);
      setSelectedSessionId(String(found.id));
    } else {
      setSelectedSessionId(null);
    }
  };

  const deleteSelectedSession = async () => {
    if (!selectedSessionId) return;
    const ok = window.confirm('Delete this session and all its stats? This cannot be undone.');
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/delete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSessionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'failed to delete session');

      await loadSessionsList();
      setSelectedSessionId(null);
      setRows(skillLabels.map((label) => ({ skill_type: label, c: null, p: null, a: null, s: null, t: null })));
      setNotes('');
      onCreated?.();
      try {
        if (player?.id) {
          fetch('/api/admin/compute-achievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'player', player_id: player.id }),
          }).catch(() => {});
        }
      } catch (e) {}

      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (player && player.id) {
      loadLatest();
      loadSessionsList();
    }
  }, [player?.id]);

  function updateCell(skillLabel: string, componentKey: ComponentKey, v: string) {
    setRows((prev) => {
      const out = [...prev];
      const skillIndex = out.findIndex(r => r.skill_type === skillLabel);
      if (skillIndex === -1) return prev;

      const n = v.trim() === "" ? null : Number(v);
      out[skillIndex] = { ...out[skillIndex], [componentKey]: n };
      return out;
    });
  }

  function computeAndApplyQuickFillForSkill(skillLabel: string, target: number) {
    setRows((prev) => {
        const out = [...prev];
        const t = Math.round(target);
        const skillIndex = out.findIndex(r => r.skill_type === skillLabel);
        if (skillIndex === -1) return prev;

        const row = out[skillIndex];
        const key = String(row.skill_type ?? '').trim().toLowerCase();
        
        const updatedRow = { ...row };
        if (key === 'movement') {
          updatedRow.t = t;
        } else {
          for (const k of componentKeys) {
            updatedRow[k] = t;
          }
        }
        out[skillIndex] = updatedRow;
        return out;
    });
  }

  function changeComponentBy(skillLabel: string, componentKey: ComponentKey, delta: number) {
    setRows((prev) => {
      const out = [...prev];
      const skillIndex = out.findIndex(r => r.skill_type === skillLabel);
      if (skillIndex === -1) return prev;

      const row = out[skillIndex];
      const cur = row[componentKey];
      const base = cur == null || Number.isNaN(Number(cur)) ? 0 : Number(cur);
      let next = Math.round(base) + delta;
      next = Math.max(0, Math.min(45, next));
      out[skillIndex] = { ...row, [componentKey]: next };
      return out;
    });
  }

  const submit = async () => {
    setError(null);

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].skill_type) {
        setError("Skill labels missing");
        return;
      }
      for (const k of componentKeys) {
        const v = rows[i][k];
        if (v !== null && v !== undefined && Number.isFinite(Number(v)) === false) {
          setError(`All component values must be numeric or blank. Check ${rows[i].skill_type} ${k.toUpperCase()}`);
          return;
        }
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Enter a valid date (YYYY-MM-DD).");
      return;
    }

    setLoading(true);
    try {
      let effectiveSessionId = selectedSessionId;
      if (!effectiveSessionId && sessionsList) {
        const found = sessionsList.find((x:any) => String(x.session_date).slice(0,10) === String(date));
        if (found) effectiveSessionId = String(found.id);
      }

      if (!player?.id) {
        const createRes = await fetch('/api/admin/create-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: newFirstName, last_name: newLastName }),
        });
        const createJson = await createRes.json();
        if (!createRes.ok) throw new Error(createJson?.error || 'Failed to create player');
        player = { ...(player || {}), id: createJson.player?.id, first_name: createJson.player?.first_name, last_name: createJson.player?.last_name };
      }

      const notesToSend = notesRef.current ?? notes;

      if (effectiveSessionId) {
        const res = await fetch('/api/admin/update-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: effectiveSessionId, session_date: date, stats_components: rows, notes: notesToSend }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to update session');
      } else {
        const res = await fetch("/api/admin/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_id: player.id,
            session_date: date,
            stats_components: rows,
            notes: notesToSend,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to create session");
      }

      onCreated?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    getState: () => ({ rows, date, notes, selectedSessionId }),
    setState: (s: { rows?: ComponentRow[]; date?: string; notes?: string; selectedSessionId?: string | null }) => {
      if (s.rows) setRows(s.rows);
      if (s.date) setDate(s.date);
      if (s.notes !== undefined) { notesRef.current = s.notes; setNotes(s.notes); }
      if (s.selectedSessionId !== undefined) {
        const sid = s.selectedSessionId ?? null;
        setSelectedSessionId(sid);
        try {
          if (sid) loadSessionById(sid);
          else setRows(skillLabels.map((label) => ({ skill_type: label, c: null, p: null, a: null, s: null, t: null })));
        } catch (e) {}
      }
    },
    submit: async () => { await submit(); }
  }), [rows, date, notes, selectedSessionId]);

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

  function getComponentHeatStyle(skill: string, component: string, rawVal: any) {
    const v = rawVal == null || rawVal === '' ? null : Number(rawVal);
    if (v == null || Number.isNaN(v)) return undefined;
    const sk = normalizeKey(String(skill || ''));
    const compMap: Record<string, string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
    const canonical = compMap[String(component)] || String(component);
    const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
    const bands = skillEntry ? (skillEntry[canonical] || skillEntry[component]) : null;
    if (!bands || !Array.isArray(bands)) return undefined;
    let bandIdx = bands.findIndex((b: any) => v >= b.min && v <= b.max);
    if (bandIdx === -1) bandIdx = v < bands[0].min ? 0 : bands.length - 1;
    const band = bands[bandIdx];
    const span = Math.max(1, (band.max - band.min));
    const frac = Math.max(0, Math.min(1, (v - band.min) / span));
    return computeBandColor(bandIdx, frac);
  }

  const renderBandPanelContent = () => {
    // Figma typography variables
    const figmaFont = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
    const figmaFontSize = '9.58154px';
    const figmaLineHeight = '11px';

    const defaultGrid = (
      <div style={{ width: '100%', maxWidth: 337 }}>
        <div style={{ fontWeight: 500, marginBottom: 6, fontFamily: figmaFont, fontSize: figmaFontSize, lineHeight: figmaLineHeight, textAlign: 'center' }}>BAND KEY</div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12, width: '100%' }}>
          {[
            { name: 'Unstable', range: '0–6', desc: 'Frequent errors; contact/timing vary' },
            { name: 'Conditional', range: '7–12', desc: 'Works in controlled settings; breaks under pressure' },
            { name: 'Functional', range: '13–18', desc: 'Reliable vs peers; may degrade under stress' },
            { name: 'Competitive', range: '19–24', desc: 'Performance holds up in match play' },
            { name: 'Advanced / Pro-Track', range: '25–30', desc: 'Advanced, maintains under fatigue and tactics' },
            { name: 'Tour Reference', range: '31+', desc: 'Elite, baseline for top-level play' },
          ].map((b, i) => {
            // split into two columns of three items each
            return null; // handled below
          })}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: figmaFont, fontSize: figmaFontSize, lineHeight: figmaLineHeight, fontWeight: 500, letterSpacing: '0.06em' }}>
            <div>Unstable (0–6) Frequent errors; contact/timing vary</div>
            <div>Conditional (7–12) Works in controlled settings; breaks under pressure</div>
            <div>Functional (13–18) Reliable vs peers; may degrade under stress</div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: figmaFont, fontSize: figmaFontSize, lineHeight: figmaLineHeight, fontWeight: 500, letterSpacing: '0.04em' }}>
            <div>Competitive (19–24) Performance holds up in match play</div>
            <div>Advanced (25–30) Advanced, maintains under fatigue and tactics</div>
            <div>Tour Reference (31+) Elite, baseline for top-level play</div>
          </div>
        </div>
      </div>
    );

    if (!hoveredBand) return defaultGrid;

    const sk = normalizeKey(hoveredBand.skill);
    const compKey = normalizeKey(hoveredBand.component);
    const compMap: Record<string, string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
    const canonicalComp = compMap[compKey] || compKey;
    const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
    const bands = skillEntry ? (skillEntry[compKey] || skillEntry[canonicalComp]) : null;
    if (!bands || !Array.isArray(bands)) return defaultGrid;

    const formatRange = (min: number, max: number) => (typeof max === 'number' && max >= 100 ? `${min}+` : `${min}–${max}`);
    const hoveredVal = hoveredBand.value;

    return (
      <div style={{ width: '100%', maxWidth: 337, fontFamily: figmaFont, fontSize: figmaFontSize, lineHeight: figmaLineHeight }}>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>{hoveredBand.skill} — {canonicalComp.charAt(0).toUpperCase() + canonicalComp.slice(1)}</div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bands.slice(0, Math.ceil(bands.length / 2)).map((b: any, i: number) => {
              const globalIndex = i;
              const active = hoveredVal != null && hoveredVal >= b.min && hoveredVal <= b.max;
              const span = Math.max(1, (b.max - b.min));
              const frac = hoveredVal != null && hoveredVal >= b.min && hoveredVal <= b.max ? Math.max(0, Math.min(1, (hoveredVal - b.min) / span)) : 0.5;
              const sw = computeBandColor(globalIndex, frac);
              return (
                <div key={`l-${b.min}-${b.max}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: 3, background: sw.background, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)', marginTop: 2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 500 }}>{b.name} <span style={{ fontSize: figmaFontSize, color: '#6b7280' }}>({formatRange(b.min, b.max)})</span></div>
                    <div style={{ color: '#374151', marginTop: 2 }}>{b.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bands.slice(Math.ceil(bands.length / 2)).map((b: any, i: number) => {
              const globalIndex = Math.ceil(bands.length / 2) + i;
              const active = hoveredVal != null && hoveredVal >= b.min && hoveredVal <= b.max;
              const span = Math.max(1, (b.max - b.min));
              const frac = hoveredVal != null && hoveredVal >= b.min && hoveredVal <= b.max ? Math.max(0, Math.min(1, (hoveredVal - b.min) / span)) : 0.5;
              const sw = computeBandColor(globalIndex, frac);
              return (
                <div key={`r-${b.min}-${b.max}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: 3, background: sw.background, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)', marginTop: 2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 500 }}>{b.name} <span style={{ fontSize: figmaFontSize, color: '#6b7280' }}>({formatRange(b.min, b.max)})</span></div>
                    <div style={{ color: '#374151', marginTop: 2 }}>{b.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderInner = () => (
    <div ref={modalRef} style={{ width: '100%' }}>
        <div style={{ marginTop: 12 }}>
          {!hideDate && (
            <>
              <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Session date</label>
                  <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} disabled={readOnly} style={{ width: 200, padding: 8, marginTop: 6 }} />
            </>
          )}
          {!player?.id && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Player name</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="First name" disabled={readOnly} style={{ padding: 8, width: 200 }} />
                <input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Last name" disabled={readOnly} style={{ padding: 8, width: 200 }} />
              </div>
            </div>
          )}
          {!hideNotes && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this session (coach comments, injuries, drills)" readOnly={readOnly} style={{ width: '100%', minHeight: 80, padding: 8, marginTop: 6 }} />
            </div>
          )}
          {/* previous session chips removed for inline page layout */}
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
            {/* Carousel: show one skill at a time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentSkillIndex((i) => (i - 1 + skillLabels.length) % skillLabels.length)} style={{ padding: '6px 10px' }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{skillLabels[currentSkillIndex]}</div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Overall: {(() => {
                  const skillRow = skillMap.get(skillLabels[currentSkillIndex]);
                  if (!skillRow) return '';
                  const key = normalizeKey(skillLabels[currentSkillIndex]);
                  if (key === 'movement') return skillRow.t != null ? String(skillRow.t) : '';
                  const present = [skillRow.c, skillRow.p, skillRow.a, skillRow.s, skillRow.t].filter((v) => v != null).map((v) => Number(v));
                  return present.length ? Math.round((present.reduce((a,b)=>a+b,0)/present.length) * 100) / 100 : '';
                })()}</div>
              </div>
              <button onClick={() => setCurrentSkillIndex((i) => (i + 1) % skillLabels.length)} style={{ padding: '6px 10px' }}>›</button>
            </div>

            <div style={{ marginTop: 12, background: '#F9F9F9', borderRadius: 12, padding: 12 }}>
              {(['c','p','a','s','t'] as ComponentKey[]).map((compKey) => {
                const ck = compKey as ComponentKey;
                const skillLabel = skillLabels[currentSkillIndex];
                const skillRow = skillMap.get(skillLabel);
                const keyNorm = normalizeKey(skillLabel);
                const isMovement = keyNorm === 'movement';
                const hide = isMovement && ['c','p','a','s'].includes(compKey as string);
                const value = skillRow ? skillRow[ck] : null;
                const heatStyle = getComponentHeatStyle(skillLabel, String(ck), value);
                return (
                  <div key={compKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      {!hide ? (
                        readOnly ? (
                          <div style={{
                            height: 36,
                            minWidth: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #ccc',
                            borderRadius: 6,
                            background: heatStyle?.background,
                            color: heatStyle?.color,
                            fontSize: 16,
                            fontWeight: 600,
                            padding: '0 8px'
                          }}>{value ?? ''}</div>
                        ) : (
                        <div style={{ /* Combined Toggle Stat Button */
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 6,
                          border: '1px solid #ccc',
                          overflow: 'hidden',
                          background: heatStyle?.background,
                          color: heatStyle?.color,
                          height: 36,
                          minWidth: 120,
                          justifyContent: 'space-between'
                        }}>
                          <button onClick={() => changeComponentBy(skillLabel, ck, -1)} style={{
                            padding: '0 8px',
                            height: '100%',
                            background: 'transparent',
                            color: 'inherit',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center'
                          }}>‹</button>
                          <input
                            value={value ?? ''}
                            onChange={(e) => updateCell(skillLabel, ck, e.target.value)}
                            style={{
                              flexGrow: 1,
                              height: '100%',
                              border: 'none',
                              background: 'transparent',
                              color: 'inherit',
                              outline: 'none',
                              fontSize: 16,
                              textAlign: 'center',
                              padding: '0',
                              margin: '0 4px'
                            }}
                          />
                          <button onClick={() => changeComponentBy(skillLabel, ck, 1)} style={{
                            padding: '0 8px',
                            height: '100%',
                            background: 'transparent',
                            color: 'inherit',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center'
                          }}>›</button>
                        </div>
                        )
                      ) : (
                        <div style={{ /* N/A State */
                          height: 36,
                          minWidth: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #ccc',
                          borderRadius: 6,
                          background: '#f0f0f0',
                          color: '#6b7280',
                          fontSize: 16,
                          fontWeight: 500
                        }}>N/A</div>
                      )}
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{componentLabels[ck]}</div>
                    </div>
                    <BandTooltip value={value ?? ''} skill={skillLabel} component={String(ck)} onHover={handleHover}>
                      <span style={{ fontSize: 14, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                    </BandTooltip>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ width: '100%', boxSizing: 'border-box', maxWidth: 359 }}>
            <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', gap: 32, position: 'relative', background: '#D9D9D9', border: '2.65693px solid rgba(0,0,0,0.23)', borderRadius: 10 }}
              onMouseEnter={() => { clearHideTimer(); }}
              onMouseLeave={() => { scheduleHide(); }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: 0, width: 337 }}>
                {/* dynamic band panel is rendered inside the Figma-styled gray container */}
                <div style={{ marginTop: 6, width: '100%' }}>
                  {renderBandPanelContent()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

        {/* duplicate band panel removed — the Figma-styled More info box above is the canonical target for hover events */}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>

          {selectedSessionId && !hideDelete && !readOnly && (
            <button onClick={deleteSelectedSession} disabled={loading} style={{ padding: "8px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4 }}>
              {loading ? "Deleting..." : "Delete session"}
            </button>
          )}
          {showSaveButton && !readOnly && (
            <button onClick={submit} disabled={loading} style={{ padding: "8px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4 }}>
              {loading ? "Saving..." : "Save session"}
            </button>
          )}
        </div>
      </div>
  );

  return renderInner();
});
