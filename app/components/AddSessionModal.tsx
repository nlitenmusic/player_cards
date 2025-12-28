'use client';
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import BandTooltip from "./Leaderboards/BandTooltip";
import referenceKey, { normalizeKey, getBand } from "../lib/referenceKey";

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
  const emptyRow = (): ComponentRow => ({ skill_type: "", c: null, p: null, a: null, s: null, t: null });

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
  const [collapsedRows, setCollapsedRows] = useState<Record<number, boolean>>({});
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const showTimeout = useRef<number | null>(null);
  const hideTimeout = useRef<number | null>(null);
  const currentContext = useRef<{ skill: string; component: string; value: number | null } | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalWidth, setModalWidth] = useState<number>(840);
  const inputFontSize = modalWidth <= 480 ? 16 : 11;
  const isMobile = modalWidth <= 480;
  

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

  function updateCell(idx: number, key: keyof ComponentRow, v: string) {
    setRows((prev) => {
      const out = [...prev];
      const n = v.trim() === "" ? null : Number(v);
      out[idx] = { ...out[idx], [key]: n };
      return out;
    });
  }

  function toggleCollapse(idx: number) {
    setCollapsedRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function toggleCollapseAll() {
    const all = rows.length > 0 && rows.every((_, i) => !!collapsedRows[i]);
    if (all) {
      setCollapsedRows({});
    } else {
      const map: Record<number, boolean> = {};
      for (let i = 0; i < rows.length; i++) map[i] = true;
      setCollapsedRows(map);
    }
  }

  function handleInputFocus(idx: number) {
    // expand the row when focusing an input and scroll it into view
    setCollapsedRows((prev) => ({ ...prev, [idx]: false }));
    const el = rowRefs.current[idx];
    if (el && typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    }
  }

  // Minimal quick-fill helper (numeric input only)

  function computeAndApplyQuickFill(idx: number, target: number) {
    const row = rows[idx];
    if (!row) return;
    const key = String(row.skill_type ?? '').trim().toLowerCase();
    const t = Math.round(target);
    if (key === 'movement') {
      updateCell(idx, 't', String(t));
      return;
    }
    const comps: (keyof ComponentRow)[] = ['c','p','a','s','t'];
    for (const k of comps) updateCell(idx, k, String(t));
  }

  // Increment/decrement a specific component cell by delta (±1).
  function changeComponentBy(idx: number, key: keyof ComponentRow, delta: number) {
    setRows((prev) => {
      const out = [...prev];
      const cur = out[idx]?.[key];
      const base = cur == null || Number.isNaN(Number(cur)) ? 0 : Number(cur);
      let next = Math.round(base) + delta;
      next = Math.max(0, Math.min(45, next));
      out[idx] = { ...out[idx], [key]: next };
      return out;
    });
  }

  // per-row custom quick-fill numeric input state
  const [customQuickFill, setCustomQuickFill] = useState<Record<number, string>>({});

  const submit = async () => {
    setError(null);

    // basic validation: ensure at least skill_type exists and numbers are finite or null
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].skill_type) {
        setError("Skill labels missing");
        return;
      }
      const keys: (keyof ComponentRow)[] = ["c","p","a","s","t"];
      for (const k of keys) {
        const v = rows[i][k];
        if (v !== null && v !== undefined && Number.isFinite(Number(v)) === false) {
          setError("All component values must be numeric or blank");
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
            <button onClick={toggleCollapseAll} disabled={loading} style={{ padding: "6px 10px" }}>{rows.length > 0 && rows.every((_, i) => !!collapsedRows[i]) ? 'Expand all' : 'Collapse all'}</button>
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
                <th style={{ textAlign: "left", padding: 6 }}>Skill</th>
                <th style={{ padding: 6 }}>C</th>
                <th style={{ padding: 6 }}>P</th>
                <th style={{ padding: 6 }}>A</th>
                <th style={{ padding: 6 }}>S</th>
                <th style={{ padding: 6 }}>T</th>
                <th style={{ padding: 6 }}>Computed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const key = String(r.skill_type ?? '').trim().toLowerCase();
                const isCollapsed = !!collapsedRows[idx];
                let computed: number | null = null;
                if (key === 'movement') {
                  // Movement authoritative rule: computed = t only (t may be null)
                  computed = r.t != null ? Number(r.t) : null;
                } else {
                  // average only non-null components (do not treat null as 0)
                  const present = [r.c, r.p, r.a, r.s, r.t].filter((v) => v != null).map((v) => Number(v));
                  computed = present.length ? present.reduce((acc, v) => acc + v, 0) / present.length : null;
                }
                const displayComputed = computed == null ? '' : Math.round(computed * 100) / 100;
                const heatC = getComponentHeatStyle(r.skill_type, 'c', r.c);
                const heatP = getComponentHeatStyle(r.skill_type, 'p', r.p);
                const heatA = getComponentHeatStyle(r.skill_type, 'a', r.a);
                const heatS = getComponentHeatStyle(r.skill_type, 's', r.s);
                const heatT = getComponentHeatStyle(r.skill_type, 't', r.t);
                // collapsed row: render a compact single-cell row that frees vertical space
                if (isCollapsed) {
                  return (
                    <tr key={`collapsed-${r.skill_type}`} ref={(el) => { rowRefs.current[idx] = el; }}>
                      <td colSpan={7} style={{ padding: 4, height: 16, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, lineHeight: 1 }}>
                          <button aria-label={`Expand ${r.skill_type}`} onClick={() => toggleCollapse(idx)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, padding: 0 }}>▸</button>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleCollapse(idx)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapse(idx); } }}
                            style={{ fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                          >
                            {r.skill_type}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={r.skill_type} ref={(el) => { rowRefs.current[idx] = el; }}>
                      <td style={{ padding: 6, position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button aria-label={`Collapse ${r.skill_type}`} onClick={() => toggleCollapse(idx)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>▾</button>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleCollapse(idx)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapse(idx); } }}
                            style={{ fontWeight: 600, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', outline: 'none' }}
                          >
                            {r.skill_type}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input aria-label={`Custom quick fill ${r.skill_type}`} type="number" min={0} max={45} value={customQuickFill[idx] ?? ''} onChange={(e) => setCustomQuickFill({ ...customQuickFill, [idx]: e.target.value })} placeholder="0–45" style={{ width: 80, padding: '4px 6px', fontSize: 12 }} onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = Number((e.target as HTMLInputElement).value);
                                if (!Number.isFinite(v)) return;
                                const clamped = Math.max(0, Math.min(45, Math.round(v)));
                                computeAndApplyQuickFill(idx, clamped);
                                setCustomQuickFill({ ...customQuickFill, [idx]: '' });
                              }
                            }} />
                            <button
                              type="button"
                              aria-label={`Apply quick-fill for ${r.skill_type}`}
                              onClick={() => {
                                const raw = customQuickFill[idx];
                                const v = Number(raw);
                                if (!Number.isFinite(v)) return;
                                const clamped = Math.max(0, Math.min(45, Math.round(v)));
                                computeAndApplyQuickFill(idx, clamped);
                                setCustomQuickFill({ ...customQuickFill, [idx]: '' });
                              }}
                              style={{ padding: '6px 10px', fontSize: 12, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </td>
                    <td style={{ padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative', width: 64, borderRadius: 5, padding: '3px', boxSizing: 'border-box', background: heatC?.background, color: heatC?.color }}>
                          <input
                            style={{ width: '100%', padding: '5px 20px 5px 5px', boxSizing: 'border-box', background: 'transparent', color: 'inherit', border: 'none', outline: 'none', fontSize: inputFontSize }}
                            value={r.c ?? ""}
                            onChange={(e) => updateCell(idx, "c", e.target.value)}
                            readOnly={isMobile}
                            inputMode={isMobile ? 'none' : undefined}
                            onFocus={(e) => { if (isMobile) { try { (e.currentTarget as HTMLInputElement).blur(); } catch (err) {} } else { handleInputFocus(idx); } }}
                          />
                          <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2, width: 14, alignItems: 'center' }}>
                            <button aria-label={`Increase ${r.skill_type} C`} onClick={() => changeComponentBy(idx, 'c', 1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▲</button>
                            <button aria-label={`Decrease ${r.skill_type} C`} onClick={() => changeComponentBy(idx, 'c', -1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▼</button>
                          </div>
                        </div>
                        <BandTooltip value={r.c ?? ''} skill={r.skill_type} component="c" onHover={handleHover}>
                          <span style={{ fontSize: 12, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                        </BandTooltip>
                      </div>
                    </td>
                    <td style={{ padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative', width: 64, borderRadius: 5, padding: '3px', boxSizing: 'border-box', background: heatP?.background, color: heatP?.color }}>
                          <input
                            style={{ width: '100%', padding: '5px 20px 5px 5px', boxSizing: 'border-box', background: 'transparent', color: 'inherit', border: 'none', outline: 'none', fontSize: inputFontSize }}
                            value={r.p ?? ""}
                            onChange={(e) => updateCell(idx, "p", e.target.value)}
                            readOnly={isMobile}
                            inputMode={isMobile ? 'none' : undefined}
                            onFocus={(e) => { if (isMobile) { try { (e.currentTarget as HTMLInputElement).blur(); } catch (err) {} } else { handleInputFocus(idx); } }}
                          />
                          <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2, width: 14, alignItems: 'center' }}>
                            <button aria-label={`Increase ${r.skill_type} P`} onClick={() => changeComponentBy(idx, 'p', 1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▲</button>
                            <button aria-label={`Decrease ${r.skill_type} P`} onClick={() => changeComponentBy(idx, 'p', -1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▼</button>
                          </div>
                        </div>
                        <BandTooltip value={r.p ?? ''} skill={r.skill_type} component="p" onHover={handleHover}>
                          <span style={{ fontSize: 12, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                        </BandTooltip>
                      </div>
                    </td>
                    <td style={{ padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative', width: 64, borderRadius: 5, padding: '3px', boxSizing: 'border-box', background: heatA?.background, color: heatA?.color }}>
                          <input
                            style={{ width: '100%', padding: '5px 20px 5px 5px', boxSizing: 'border-box', background: 'transparent', color: 'inherit', border: 'none', outline: 'none', fontSize: inputFontSize }}
                            value={r.a ?? ""}
                            onChange={(e) => updateCell(idx, "a", e.target.value)}
                            readOnly={isMobile}
                            inputMode={isMobile ? 'none' : undefined}
                            onFocus={(e) => { if (isMobile) { try { (e.currentTarget as HTMLInputElement).blur(); } catch (err) {} } else { handleInputFocus(idx); } }}
                          />
                          <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2, width: 14, alignItems: 'center' }}>
                            <button aria-label={`Increase ${r.skill_type} A`} onClick={() => changeComponentBy(idx, 'a', 1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▲</button>
                            <button aria-label={`Decrease ${r.skill_type} A`} onClick={() => changeComponentBy(idx, 'a', -1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▼</button>
                          </div>
                        </div>
                        <BandTooltip value={r.a ?? ''} skill={r.skill_type} component="a" onHover={handleHover}>
                          <span style={{ fontSize: 12, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                        </BandTooltip>
                      </div>
                    </td>
                    <td style={{ padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative', width: 64, borderRadius: 5, padding: '3px', boxSizing: 'border-box', background: heatS?.background, color: heatS?.color }}>
                          <input
                            style={{ width: '100%', padding: '5px 20px 5px 5px', boxSizing: 'border-box', background: 'transparent', color: 'inherit', border: 'none', outline: 'none', fontSize: inputFontSize }}
                            value={r.s ?? ""}
                            onChange={(e) => updateCell(idx, "s", e.target.value)}
                            readOnly={isMobile}
                            inputMode={isMobile ? 'none' : undefined}
                            onFocus={(e) => { if (isMobile) { try { (e.currentTarget as HTMLInputElement).blur(); } catch (err) {} } else { handleInputFocus(idx); } }}
                          />
                          <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2, width: 14, alignItems: 'center' }}>
                            <button aria-label={`Increase ${r.skill_type} S`} onClick={() => changeComponentBy(idx, 's', 1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▲</button>
                            <button aria-label={`Decrease ${r.skill_type} S`} onClick={() => changeComponentBy(idx, 's', -1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▼</button>
                          </div>
                        </div>
                        <BandTooltip value={r.s ?? ''} skill={r.skill_type} component="s" onHover={handleHover}>
                          <span style={{ fontSize: 12, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                        </BandTooltip>
                      </div>
                    </td>
                    <td style={{ padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative', width: 64, borderRadius: 5, padding: '3px', boxSizing: 'border-box', background: heatT?.background, color: heatT?.color }}>
                          <input
                            style={{ width: '100%', padding: '5px 20px 5px 5px', boxSizing: 'border-box', background: 'transparent', color: 'inherit', border: 'none', outline: 'none', fontSize: inputFontSize }}
                            value={r.t ?? ""}
                            onChange={(e) => updateCell(idx, "t", e.target.value)}
                            readOnly={isMobile}
                            inputMode={isMobile ? 'none' : undefined}
                            onFocus={(e) => { if (isMobile) { try { (e.currentTarget as HTMLInputElement).blur(); } catch (err) {} } else { handleInputFocus(idx); } }}
                          />
                          <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2, width: 14, alignItems: 'center' }}>
                            <button aria-label={`Increase ${r.skill_type} T`} onClick={() => changeComponentBy(idx, 't', 1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▲</button>
                            <button aria-label={`Decrease ${r.skill_type} T`} onClick={() => changeComponentBy(idx, 't', -1)} style={{ width: 14, height: 10, padding: 0, fontSize: 9, lineHeight: '1', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>▼</button>
                          </div>
                        </div>
                        <BandTooltip value={r.t ?? ''} skill={r.skill_type} component="t" onHover={handleHover}>
                          <span style={{ fontSize: 12, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                        </BandTooltip>
                      </div>
                    </td>
                    <td style={{ padding: 6 }}>{displayComputed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Static band key removed — the bottom Band key panel updates on hover */}

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