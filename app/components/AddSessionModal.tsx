'use client';
import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import BandTooltip from "./Leaderboards/BandTooltip";
import referenceKey, { normalizeKey, getBand } from "../lib/referenceKey";

type ComponentKey = 'c' | 'p' | 'a' | 's' | 't';
type ComponentRow = { skill_type: string; c?: number | null; p?: number | null; a?: number | null; s?: number | null; t?: number | null };

export default function AddSessionModal({
  player,
  onClose,
  onCreated,
}: {
  player: any;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const skillLabels = ["Serve", "Return", "Forehand", "Backhand", "Volley", "Overhead", "Movement"];
  const componentKeys: ComponentKey[] = ['c', 'p', 'a', 's', 't'];
  const componentLabels: Record<ComponentKey, string> = {
    c: 'Consistency', p: 'Power', a: 'Accuracy', s: 'Spin', t: 'Technique'
  };

  const [rows, setRows] = useState<ComponentRow[]>(() =>
    skillLabels.map((label) => ({ skill_type: label, c: null, p: null, a: null, s: null, t: null }))
  );
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [notes, setNotes] = useState<string>(player?.notes ?? '');
  const [newFirstName, setNewFirstName] = useState<string>(player?.first_name ?? '');
  const [newLastName, setNewLastName] = useState<string>(player?.last_name ?? '');
  const [hoveredBand, setHoveredBand] = useState<{ skill: string; component: string; value: number | null } | null>(null);
  const [sessionsList, setSessionsList] = useState<any[] | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  // Replaced collapsedRows and rowRefs with simpler state for quick-fill per skill
  const [customQuickFill, setCustomQuickFill] = useState<Record<string, string>>({}); // Keyed by skillLabel

  const showTimeout = useRef<number | null>(null);
  const hideTimeout = useRef<number | null>(null);
  const currentContext = useRef<{ skill: string; component: string; value: number | null } | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalWidth, setModalWidth] = useState<number>(840);
  const inputFontSize = modalWidth <= 480 ? 16 : 11;
  const isMobile = modalWidth <= 480;

  // Memoize skillMap for efficient lookups in rendering
  const skillMap = useMemo(() => {
    const map = new Map<string, ComponentRow>();
    rows.forEach(r => map.set(r.skill_type, r));
    return map;
  }, [rows]);

  // Controlled hover lifecycle: debounced show, delayed hide; supports entering panel
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
      try { console.debug('AddSessionModal: scheduleShow -> setHoveredBand', ctx); } catch(e){}
      setHoveredBand(ctx);
      showTimeout.current = null;
    }, 120);
  }

  function scheduleHide(delay = 250) {
    clearShowTimer();
    clearHideTimer();
    hideTimeout.current = window.setTimeout(() => {
      try { console.debug('AddSessionModal: scheduleHide -> clear hoveredBand'); } catch(e){}
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
    try { console.debug('AddSessionModal: hoveredBand changed', hoveredBand); } catch(e){}
    function updateWidth() {
      const w = modalRef.current?.clientWidth ?? 840;
      setModalWidth(w);
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    // no-op: previously handled click-outside for quick-fill dropdown
    return () => {};
  }, []);

  // load latest session components for this player
  const loadLatest = async () => {
    setError(null);
    setLoadingLatest(true);
    try {
      const res = await fetch(`/api/admin/player-latest-stats?player_id=${player.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load latest stats");
      const data: ComponentRow[] = json?.stats ?? [];
      if (data.length) {
        // normalize DB keys (trim + lowercase) and detect duplicates / unexpected keys
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

        // build rows using normalized lookup
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
        // set notes to the value from the payload if provided; keep the date default as today for new sessions
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

  // load all sessions for this player (for calendar notches and per-date loading)
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

      // refresh sessions list and clear modal state
      await loadSessionsList();
      setSelectedSessionId(null);
      setRows(skillLabels.map((label) => ({ skill_type: label, c: null, p: null, a: null, s: null, t: null })));
      setNotes('');
      onCreated?.();
      // trigger background recompute for this player so achievements stay up-to-date
      try {
        if (player?.id) {
          fetch('/api/admin/compute-achievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'player', player_id: player.id }),
          }).catch(() => {});
        }
      } catch (e) {}

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Automatically load latest stats when the modal opens (or when player changes)
  useEffect(() => {
    if (player && player.id) {
      loadLatest();
      loadSessionsList();
    }
    // Intentionally only run when player.id changes or on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  function updateCell(skillLabel: string, componentKey: ComponentKey, v: string) {
    setRows((prev) => {
      const out = [...prev];
      const skillIndex = out.findIndex(r => r.skill_type === skillLabel);
      if (skillIndex === -1) return prev; // Should not happen

      const n = v.trim() === "" ? null : Number(v);
      out[skillIndex] = { ...out[skillIndex], [componentKey]: n };
      return out;
    });
  }

  // Quick-fill helper for a specific skill (column)
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

  // Increment/decrement a specific component cell by delta (±1) for a specific skill.
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

    // basic validation: ensure at least skill_type exists and numbers are finite or null
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
      // If we don't have a selectedSessionId, check sessionsList for an existing session on this date.
      let effectiveSessionId = selectedSessionId;
      if (!effectiveSessionId && sessionsList) {
        const found = sessionsList.find((x:any) => String(x.session_date).slice(0,10) === String(date));
        if (found) effectiveSessionId = String(found.id);
      }

      if (!player?.id) {
        // create the player first
        const createRes = await fetch('/api/admin/create-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: newFirstName, last_name: newLastName }),
        });
        const createJson = await createRes.json();
        if (!createRes.ok) throw new Error(createJson?.error || 'Failed to create player');
        // use returned player id
        player = { ...(player || {}), id: createJson.player?.id, first_name: createJson.player?.first_name, last_name: createJson.player?.last_name };
      }

      if (effectiveSessionId) {
        // update existing session
        const res = await fetch('/api/admin/update-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: effectiveSessionId, session_date: date, stats_components: rows, notes }),
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
            notes,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to create session");
      }

      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Render the band key panel content. This ensures hovered content and
  // the default band key share identical formatting and layout.
  // Band base hues (per-band distinct color): Unstable -> Conditional -> Functional -> Competitive -> Advanced -> Tour
  const BAND_BASE_HUES = [0, 28, 52, 140, 200, 270];
  const BAND_BASE_LIGHTNESS = [78, 74, 60, 72, 78, 84];

  function computeBandColor(bandIdx: number, frac = 0.5) {
    const hue = BAND_BASE_HUES[bandIdx] ?? 200;
    const baseL = BAND_BASE_LIGHTNESS[bandIdx] ?? 72;
    const darken = Math.round(Math.min(22, frac * 22)); // darker as frac -> 1
    const lightness = Math.max(12, Math.min(92, baseL - darken));
    const saturation = 72;
    const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const color = lightness > 56 ? '#111' : '#fff';
    return { background, color };
  }

  // Compute a heatmap color for a component value relative to its bands.
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
    // Use band-specific hue and darken as value approaches band max
    return computeBandColor(bandIdx, frac);
  }
  const renderBandPanelContent = () => {
    const defaultGrid = (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Band key</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {[
            { name: 'Unstable', range: '0–6', desc: 'Frequent errors; contact/timing vary' },
            { name: 'Conditional', range: '7–12', desc: 'Works in controlled settings; breaks under pressure' },
            { name: 'Functional', range: '13–18', desc: 'Reliable vs peers; may degrade under stress' },
            { name: 'Competitive', range: '19–24', desc: 'Performance holds up in match play' },
            { name: 'Advanced / Pro-Track', range: '25–30', desc: 'Advanced, maintains under fatigue and tactics' },
            { name: 'Tour Reference', range: '31+', desc: 'Elite, baseline for top-level play' },
          ].map((b, i) => {
            const sw = computeBandColor(i, 0.5);
            return (
              <div key={b.name} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                <span style={{ width: 14, height: 14, display: 'inline-block', borderRadius: 3, background: sw.background, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div><strong style={{ marginRight: 6 }}>{b.name}</strong> <span style={{ fontSize: 12, color: '#6b7280' }}>({b.range})</span></div>
                  <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>{b.desc}</div>
                </div>
              </div>
            );
          })}
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
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{hoveredBand.skill} — {canonicalComp.charAt(0).toUpperCase() + canonicalComp.slice(1)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {bands.map((b: any, i: number) => {
            const active = hoveredVal != null && hoveredVal >= b.min && hoveredVal <= b.max;
            const span = Math.max(1, (b.max - b.min));
            const frac = hoveredVal != null && hoveredVal >= b.min && hoveredVal <= b.max ? Math.max(0, Math.min(1, (hoveredVal - b.min) / span)) : 0.5;
            const sw = computeBandColor(i, frac);
            return (
              <div key={`${b.min}-${b.max}`} style={{ fontSize: 13, padding: '2px 0', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: 3, background: sw.background, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)', marginTop: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div style={{ fontWeight: active ? 700 : 600, fontSize: 13 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>({formatRange(b.min, b.max)})</div>
                  </div>
                  <div style={{ color: '#374151', fontSize: 13, marginTop: 2 }}>{b.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div ref={modalRef} style={{ background: "#fff", padding: 16, borderRadius: 8, width: 840, maxWidth: "96%", maxHeight: "90%", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Add / Edit Session — {player.first_name} {player.last_name}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} disabled={loading} style={{ padding: "6px 10px" }}>Close</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Session date</label>
          <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} style={{ width: 200, padding: 8, marginTop: 6 }} />
          {!player?.id && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Player name</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="First name" style={{ padding: 8, width: 200 }} />
                <input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Last name" style={{ padding: 8, width: 200 }} />
              </div>
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this session (coach comments, injuries, drills)" style={{ width: '100%', minHeight: 80, padding: 8, marginTop: 6 }} />
          </div>
          {sessionsList && sessionsList.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sessionsList.map((s:any) => {
                const d = String(s.session_date).slice(0,10);
                const isActive = d === date;
                return (
                  <button key={s.id} onClick={() => loadSessionById(s.id)} type="button" style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, border: isActive ? '1px solid #3b82f6' : '1px solid #e5e7eb', background: isActive ? '#eff6ff' : '#fff' }}>
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 6, minWidth: '80px' }}>Component</th>
                {skillLabels.map((skillLabel) => (
                    <th key={skillLabel} style={{ padding: 6, minWidth: '100px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600 }}>{skillLabel}</div>
                        {/* Quick-fill inputs for each skill column */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4 }}>
                            <input
                                aria-label={`Custom quick fill ${skillLabel}`}
                                type="number"
                                min={0}
                                max={45}
                                value={customQuickFill[skillLabel] ?? ''}
                                onChange={(e) => setCustomQuickFill({ ...customQuickFill, [skillLabel]: e.target.value })}
                                placeholder="0–45"
                                style={{ width: '100%', padding: '4px 6px', fontSize: 12, textAlign: 'center' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const v = Number((e.target as HTMLInputElement).value);
                                        if (!Number.isFinite(v)) return;
                                        const clamped = Math.max(0, Math.min(45, Math.round(v)));
                                        computeAndApplyQuickFillForSkill(skillLabel, clamped);
                                        setCustomQuickFill({ ...customQuickFill, [skillLabel]: '' });
                                    }
                                }}
                            />
                            <button
                                type="button"
                                aria-label={`Apply quick-fill for ${skillLabel}`}
                                onClick={() => {
                                    const raw = customQuickFill[skillLabel];
                                    const v = Number(raw);
                                    if (!Number.isFinite(v)) return;
                                    const clamped = Math.max(0, Math.min(45, Math.round(v)));
                                    computeAndApplyQuickFillForSkill(skillLabel, clamped);
                                    setCustomQuickFill({ ...customQuickFill, [skillLabel]: '' });
                                }}
                                style={{ padding: '3px 8px', fontSize: 10, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 4, width: '100%' }}
                            >
                                Apply
                            </button>
                        </div>
                    </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {componentKeys.map((componentKey) => {
                return (
                  <tr key={String(componentKey)}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{componentLabels[componentKey]}</td>
                    {skillLabels.map((skillLabel) => {
                      const skillRow = skillMap.get(skillLabel);
                      const key = normalizeKey(skillLabel);
                      const isMovement = key === 'movement';
                      const isMovementCPASE = isMovement && ['c', 'p', 'a', 's'].includes(String(componentKey));

                      const value = skillRow ? skillRow[componentKey] : null;
                      const heatStyle = getComponentHeatStyle(skillLabel, String(componentKey), value);

                      return (
                        <td key={`${skillLabel}-${String(componentKey)}`} style={{ padding: 6 }}>
                          {isMovementCPASE ? (
                            <span style={{ color: '#9ca3af', fontSize: 13 }}>N/A</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ position: 'relative', width: 64, borderRadius: 5, padding: '3px', boxSizing: 'border-box', background: heatStyle?.background, color: heatStyle?.color }}>
                                <input
                                  style={{ width: '100%', padding: '5px 20px 5px 5px', boxSizing: 'border-box', background: 'transparent', color: 'inherit', border: 'none', outline: 'none', fontSize: inputFontSize }}
                                  value={value ?? ""}
                                  onChange={(e) => updateCell(skillLabel, componentKey, e.target.value)}
                                  readOnly={isMobile}
                                  inputMode={isMobile ? 'none' : undefined}
                                />
                                <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2, width: 14, alignItems: 'center' }}>
                                  <button aria-label={`Increase ${skillLabel} ${String(componentKey).toUpperCase()}`} onClick={() => changeComponentBy(skillLabel, componentKey, 1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▲</button>
                                  <button aria-label={`Decrease ${skillLabel} ${String(componentKey).toUpperCase()}`} onClick={() => changeComponentBy(skillLabel, componentKey, -1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▼</button>
                                </div>
                              </div>
                              <BandTooltip value={value ?? ''} skill={skillLabel} component={String(componentKey)} onHover={handleHover}>
                                <span style={{ fontSize: 12, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                              </BandTooltip>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Computed Row */}
              <tr>
                <td style={{ padding: 6, fontWeight: 600 }}>Computed</td>
                {skillLabels.map((skillLabel) => {
                  const skillRow = skillMap.get(skillLabel);
                  let computed: number | null = null;
                  const key = normalizeKey(skillLabel);
                  if (key === 'movement') {
                    computed = skillRow?.t != null ? Number(skillRow.t) : null;
                  } else {
                    const present = [skillRow?.c, skillRow?.p, skillRow?.a, skillRow?.s, skillRow?.t].filter((v) => v != null).map((v) => Number(v));
                    computed = present.length ? present.reduce((acc, v) => acc + v, 0) / present.length : null;
                  }
                  const displayComputed = computed == null ? '' : Math.round(computed * 100) / 100;
                  return (
                    <td key={`computed-${skillLabel}`} style={{ padding: 6, textAlign: 'center' }}>
                      {displayComputed}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

        <div style={{ marginTop: 12 }}>
          <div
            style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e6edf3' }}
            onMouseEnter={() => { clearHideTimer(); }}
            onMouseLeave={() => { scheduleHide(); }}
          >
            {renderBandPanelContent()}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button onClick={() => { setRows(skillLabels.map((label) => ({ skill_type: label, c: null, p: null, a: null, s: null, t: null }))); }} style={{ padding: "8px 12px" }} disabled={loading}>Clear</button>
          {selectedSessionId && (
            <button onClick={deleteSelectedSession} disabled={loading} style={{ padding: "8px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4 }}>
              {loading ? "Deleting..." : "Delete session"}
            </button>
          )}
          <button onClick={submit} disabled={loading} style={{ padding: "8px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4 }}>
            {loading ? "Saving..." : "Save session"}
          </button>
        </div>
      </div>
    </div>
  );
}