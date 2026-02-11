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

export default React.forwardRef(function AddSessionForm({ player, sessionId: sessionIdProp, onClose, onCreated, hideDate, hideNotes, showSaveButton = true, hideDelete = false, navSlot, suppressNoPreviousMessage = false, showQuickFill = false, showArchetypes = false }: { player: any; sessionId?: string | null; onClose?: () => void; onCreated?: () => void; hideDate?: boolean; hideNotes?: boolean; showSaveButton?: boolean; hideDelete?: boolean; navSlot?: React.ReactNode; suppressNoPreviousMessage?: boolean; showQuickFill?: boolean; showArchetypes?: boolean }, ref: React.Ref<AddSessionFormHandle>) {
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
  const [newFirstName, setNewFirstName] = useState<string>(player?.first_name ?? '');
  const [newLastName, setNewLastName] = useState<string>(player?.last_name ?? '');
  const [hoveredBand, setHoveredBand] = useState<{ skill: string; component: string; value: number | null } | null>(null);
  const [sessionsList, setSessionsList] = useState<any[] | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [customQuickFill, setCustomQuickFill] = useState<Record<string, string>>({});
  const [archetypesBySkill, setArchetypesBySkill] = useState<Record<string, any[]> | null>(null);
  const [selectedArchetypeName, setSelectedArchetypeName] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [expandedAnchors, setExpandedAnchors] = useState<Record<string, boolean>>({});

  const showTimeout = useRef<number | null>(null);
  const hideTimeout = useRef<number | null>(null);
  const inactivityTimeout = useRef<number | null>(null);
  const pinned = useRef<boolean>(false);
  const currentContext = useRef<{ skill: string; component: string; value: number | null } | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const componentsCarouselRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeComponentIndex, setActiveComponentIndex] = useState<number>(0);
  function scrollComponentsBy(pixelDelta: number) {
    // kept for backward compatibility but prefer goToComponentIndex
    const el = componentsCarouselRef.current;
    if (!el) return;
    try { el.scrollBy({ left: pixelDelta, behavior: 'smooth' }); } catch (e) { el.scrollLeft += pixelDelta; }
  }
  const [componentItemWidth, setComponentItemWidth] = useState<number>(320);
  useEffect(() => {
    const el = componentsCarouselRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth || 0;
      const overlay = 112; // accounts for left+right button overlays (56 + 56)
      const gap = 12; // gap between items
      const base = Math.max(280, Math.round(w - overlay));
      setComponentItemWidth(base);
      // ensure active item is centered after width change
      setTimeout(() => { if (itemRefs.current[activeComponentIndex]) { try { itemRefs.current[activeComponentIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center' } as any); } catch (e) {} } }, 50);
    };
    compute();
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => compute());
      ro.observe(el);
    } catch (e) {
      window.addEventListener('resize', compute);
    }
    return () => {
      try { if (ro) ro.disconnect(); } catch (e) {}
      window.removeEventListener('resize', compute);
    };
  }, [componentsCarouselRef.current]);

  

  function goToComponentIndex(idx: number) {
    const clamped = Math.max(0, Math.min((['c','p','a','s','t'] as ComponentKey[]).length - 1, idx));
    setActiveComponentIndex(clamped);
    const node = itemRefs.current[clamped];
    if (node && node.scrollIntoView) {
      try { node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' } as any); } catch (e) { /* ignore */ }
    }
  }

  // touch swipe support for mobile
  useEffect(() => {
    const el = componentsCarouselRef.current;
    if (!el) return;
    let startX: number | null = null;
    function onTouchStart(e: TouchEvent) { startX = e.touches?.[0]?.clientX ?? null; }
    function onTouchEnd(e: TouchEvent) {
      if (startX == null) return;
      const endX = (e.changedTouches?.[0]?.clientX) ?? null;
      if (endX == null) { startX = null; return; }
      const dx = endX - startX;
      const thresh = 40; // px
      if (dx > thresh) goToComponentIndex(activeComponentIndex - 1);
      else if (dx < -thresh) goToComponentIndex(activeComponentIndex + 1);
      startX = null;
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => { el.removeEventListener('touchstart', onTouchStart as any); el.removeEventListener('touchend', onTouchEnd as any); };
  }, [componentsCarouselRef.current, activeComponentIndex]);

  // sync activeComponentIndex to the physical scroll position so
  // the overlay prev/next buttons always land on the same targets
  useEffect(() => {
    const el = componentsCarouselRef.current;
    if (!el) return;
    let raf = 0;
    function onScroll() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          const center = el.scrollLeft + (el.clientWidth / 2);
          let closest = 0;
          let closestDist = Infinity;
          for (let i = 0; i < (itemRefs.current?.length || 0); i++) {
            const node = itemRefs.current[i];
            if (!node) continue;
            const nodeCenter = node.offsetLeft + (node.offsetWidth / 2);
            const d = Math.abs(nodeCenter - center);
            if (d < closestDist) { closestDist = d; closest = i; }
          }
          setActiveComponentIndex((prev) => (prev === closest ? prev : closest));
        } catch (e) {}
      });
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    // run once to sync initial state
    onScroll();
    return () => { el.removeEventListener('scroll', onScroll as any); if (raf) cancelAnimationFrame(raf); };
  }, [componentsCarouselRef.current, componentItemWidth]);
  const [modalWidth, setModalWidth] = useState<number>(840);
  const inputFontSize = modalWidth <= 480 ? 16 : 11;
  const isMobile = modalWidth <= 480;

  const skillMap = useMemo(() => {
    const map = new Map<string, ComponentRow>();
    rows.forEach(r => map.set(r.skill_type, r));
    return map;
  }, [rows]);

  const [currentSkillIndex, setCurrentSkillIndex] = useState<number>(0);

  useEffect(() => {
    // reset component index when skill changes
    setActiveComponentIndex(0);
    setTimeout(() => { if (itemRefs.current[0]) { try { itemRefs.current[0]?.scrollIntoView({ behavior: 'smooth', inline: 'center' } as any); } catch (e) {} } }, 40);
  }, [currentSkillIndex]);

  function clearShowTimer() {
    if (showTimeout.current) { window.clearTimeout(showTimeout.current); showTimeout.current = null; }
  }
  function clearHideTimer() {
    if (hideTimeout.current) { window.clearTimeout(hideTimeout.current); hideTimeout.current = null; }
  }

  function clearInactivityTimer() {
    if (inactivityTimeout.current) { window.clearTimeout(inactivityTimeout.current); inactivityTimeout.current = null; }
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
    // respect pinned (click-open) mode: do not hide while pinned
    if (pinned.current) return;
    clearInactivityTimer();
    hideTimeout.current = window.setTimeout(() => {
      try { console.debug('AddSessionForm: scheduleHide -> clear hoveredBand'); } catch(e){}
      setHoveredBand(null);
      currentContext.current = null;
      hideTimeout.current = null;
    }, delay);
  }

  function handleHover(ctx: { skill: string; component: string; value: number | null; immediate?: boolean } | null) {
    if (ctx) {
      if (ctx.immediate) {
        // immediate open requested (click) — open now and cancel any hide timer
        clearHideTimer();
        clearShowTimer();
        // enter pinned mode so the panel stays open until explicitly closed
        pinned.current = true;
        currentContext.current = { skill: ctx.skill, component: ctx.component, value: ctx.value };
        try { console.debug('AddSessionForm: immediate open (pinned) -> setHoveredBand', ctx); } catch (e) {}
        setHoveredBand({ skill: ctx.skill, component: ctx.component, value: ctx.value });
      } else {
        scheduleShow(ctx);
      }
    } else scheduleHide();
  }

  function closeHoveredBand() {
    try { console.debug('AddSessionForm: closeHoveredBand -> clearing pinned/hovers'); } catch (e) {}
    pinned.current = false;
    clearShowTimer();
    clearHideTimer();
    clearInactivityTimer();
    currentContext.current = null;
    setHoveredBand(null);
  }

  useEffect(() => {
    return () => {
      clearShowTimer();
      clearHideTimer();
      clearInactivityTimer();
    };
  }, []);

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

  // On mount, scroll the nearest scrollable container (or the modal wrapper) to the bottom
  useEffect(() => {
    try {
      const el = modalRef.current;
      if (!el) return;

      const findScrollContainer = (node: HTMLElement | null): HTMLElement | (Element & { scrollTop: number }) => {
        let n: HTMLElement | null = node;
        while (n && n !== document.body) {
          const style = window.getComputedStyle(n);
          const overflowY = style.overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') return n;
          n = n.parentElement;
        }
        return document.scrollingElement || document.documentElement;
      };

      const sc = findScrollContainer(el) as any;
      const id = window.setTimeout(() => {
        try { sc.scrollTop = sc.scrollHeight; } catch (e) {}
      }, 50);
      return () => window.clearTimeout(id);
    } catch (e) {
      // no-op
    }
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
        if (!suppressNoPreviousMessage) setError("No previous session stats found for this player");
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

  // Build archetypes from the loaded sessionsList and include built-in presets
  async function loadArchetypes() {
    try {
      if (!sessionsList) return;
      // dynamic import of archetypes utility
      const mod = await import('../utils/archetypes');
      const generated = (mod.generateArchetypesFromSessions && mod.generateArchetypesFromSessions(sessionsList, skillLabels, componentKeys, 3)) || {};
      const built = (mod.getBuiltInArchetypes && mod.getBuiltInArchetypes()) || {};
      const merged: Record<string, any[]> = {};
      for (const s of skillLabels) merged[s] = [];
      for (const s of Object.keys(built || {})) merged[s] = (merged[s] || []).concat(built[s] || []);
      for (const s of Object.keys(generated || {})) merged[s] = (merged[s] || []).concat(generated[s] || []);
      setArchetypesBySkill(merged);
    } catch (e) {
      console.error('loadArchetypes error', e);
      setArchetypesBySkill({});
    }
  }

  // If a selectedSessionId was set before sessionsList finished loading,
  // watch for sessionsList to become available and then load that session.
  useEffect(() => {
    try {
      if (!sessionsList || !selectedSessionId) return;
      // if the currently loaded rows do not belong to the selected session, load it
      const found = sessionsList.find((x:any) => String(x.id) === String(selectedSessionId));
      if (found) {
        loadSessionById(selectedSessionId);
      }
    } catch (e) {
      // ignore
    }
  }, [sessionsList, selectedSessionId]);

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
      // If a sessionId prop was provided by the parent, prefer loading that
      // session rather than the aggregated "latest" stats. This prevents
      // the UI from always being overwritten by the latest session when the
      // user intends to view a specific historical session.
      if (sessionIdProp) {
        // ensure sessions list is loaded and then load the requested session
        (async () => {
          await loadSessionsList();
          try { loadSessionById(sessionIdProp); } catch (e) {}
        })();
      } else {
        if (!selectedSessionId) {
          // only load the player's latest aggregated stats when we're not
          // actively viewing a specific session, to avoid overwriting
          // a session's rows with the latest stats.
          loadLatest();
        }
        loadSessionsList();
      }
    }
  }, [player?.id]);

  // Keep internal selectedSessionId in sync when parent provides a sessionId prop
  useEffect(() => {
    try {
      if (!sessionIdProp) return;
      if (String(selectedSessionId) === String(sessionIdProp)) return;
      setSelectedSessionId(String(sessionIdProp));
      // attempt to load the session immediately if sessionsList already available
      if (sessionsList) {
        try { loadSessionById(sessionIdProp); } catch (e) {}
      }
    } catch (e) {}
  }, [sessionIdProp]);

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
    // Use integer lookup so fractional values map to the band containing their floor
    const vLookup = Math.floor(v);
    let bandIdx = bands.findIndex((b: any) => vLookup >= b.min && vLookup <= b.max);
    if (bandIdx === -1) bandIdx = v < bands[0].min ? 0 : bands.length - 1;
    const band = bands[bandIdx];
    const span = Math.max(1, (band.max - band.min));
    const frac = Math.max(0, Math.min(1, (v - band.min) / span));
    return computeBandColor(bandIdx, frac);
  }

  function formatRange(min: number, max: number) {
    return (typeof max === 'number' && max >= 100) ? `${min}+` : `${min}–${max}`;
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
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: figmaFont, fontSize: figmaFontSize, lineHeight: figmaLineHeight, fontWeight: 500, letterSpacing: '0.06em' }}>
            {[
              { name: 'Unstable', range: '0–6', desc: 'Frequent errors; contact/timing vary' },
              { name: 'Conditional', range: '7–12', desc: 'Works in controlled settings; breaks under pressure' },
              { name: 'Functional', range: '13–18', desc: 'Reliable vs peers; may degrade under stress' },
            ].map((b, i) => {
              const sw = computeBandColor(i, 0.5);
              return (
                <div key={`l-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: 3, background: sw.background, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }} />
                  <div>{b.name} ({b.range}) {b.desc}</div>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: figmaFont, fontSize: figmaFontSize, lineHeight: figmaLineHeight, fontWeight: 500, letterSpacing: '0.04em' }}>
            {[
              { name: 'Competitive', range: '19–24', desc: 'Performance holds up in match play' },
              { name: 'Advanced', range: '25–30', desc: 'Advanced, maintains under fatigue and tactics' },
              { name: 'Tour Reference', range: '31+', desc: 'Elite, baseline for top-level play' },
            ].map((b, i) => {
              const sw = computeBandColor(i + 3, 0.5);
              return (
                <div key={`r-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: 3, background: sw.background, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }} />
                  <div>{b.name} ({b.range}) {b.desc}</div>
                </div>
              );
            })}
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
      <div style={{ position: 'relative', width: '100%', maxWidth: 337, fontFamily: figmaFont, fontSize: figmaFontSize, lineHeight: figmaLineHeight }}>
        <button onClick={closeHoveredBand} aria-label="Close band info" style={{ position: 'absolute', right: 6, top: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, padding: 6 }}>✕</button>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>{hoveredBand.skill} — {canonicalComp.charAt(0).toUpperCase() + canonicalComp.slice(1)}</div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bands.slice(0, Math.ceil(bands.length / 2)).map((b: any, i: number) => {
              const globalIndex = i;
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
              const anchorsForBand = (() => {
                try {
                  const src = getBand(hoveredBand.skill, canonicalComp, Math.round((b.min + b.max) / 2)) || {};
                  return Array.isArray((src as any).anchors) ? (src as any).anchors as string[] : [];
                } catch (e) { return [] as string[]; }
              })();
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
              <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} style={{ width: 200, padding: 8, marginTop: 6 }} />
            </>
          )}
          {!player?.id && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Player name</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="First name" style={{ padding: 8, width: 200 }} />
                <input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Last name" style={{ padding: 8, width: 200 }} />
              </div>
            </div>
          )}
          {!hideNotes && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this session (coach comments, injuries, drills)" style={{ width: '100%', minHeight: 80, padding: 8, marginTop: 6 }} />
            </div>
          )}
          {/* previous session chips removed for inline page layout */}
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: '100%', maxWidth: 360, position: 'relative' as any }}>
            {/* Carousel: show one skill at a time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="chev-btn chev-left" onClick={() => setCurrentSkillIndex((i) => (i - 1 + skillLabels.length) % skillLabels.length)} style={{ padding: '6px 10px' }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                {
                  (() => {
                    const skillLabel = skillLabels[currentSkillIndex];
                    const skillRow = skillMap.get(skillLabel);
                    let v: number | null = null;
                    if (skillRow) {
                      const key = normalizeKey(skillLabel);
                      if (key === 'movement') {
                        v = skillRow.t == null ? null : Number(skillRow.t);
                      } else {
                        const present = [skillRow.c, skillRow.p, skillRow.a, skillRow.s, skillRow.t].filter((x) => x != null).map((x) => Number(x));
                        if (present.length) v = present.reduce((a, b) => a + b, 0) / present.length;
                      }
                    }
                    const displayValue = v == null || Number.isNaN(Number(v)) ? '' : String(Math.round(Number(v) * 100) / 100);
                    const band = v != null && !Number.isNaN(Number(v)) ? getBand(skillLabel, 'overall', Math.floor(Number(v))) : null;
                    const fallbackBand = getBand(skillLabel, 'overall', 18); // mid-range default (Functional)
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 20 }}>{skillLabel}</div>
                          <BandTooltip value={v ?? ''} skill={skillLabel} component={'overall'} onHover={handleHover}>
                            <span tabIndex={-1} aria-hidden="true" style={{ fontSize: 14, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                          </BandTooltip>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                          Overall: {displayValue} {(band || fallbackBand) ? (<>
                            <span style={{ fontWeight: 700, color: '#111', marginLeft: 6 }}>{(band || fallbackBand).name}</span>
                            <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>({formatRange((band || fallbackBand).min, (band || fallbackBand).max)})</span>
                            <div style={{ marginTop: 4, color: '#374151', fontSize: 12, maxWidth: 420 }}>{(band || fallbackBand).description}</div>
                          </>) : null}
                        </div>
                      </div>
                    );
                  })()
                }
              </div>
              <button className="chev-btn chev-right" onClick={() => setCurrentSkillIndex((i) => (i + 1) % skillLabels.length)} style={{ padding: '6px 10px' }}>›</button>
            </div>

            <div className="skill-panel" style={{ marginTop: 12, background: '#F9F9F9', borderRadius: 12, padding: 12, position: 'relative' as any }}>
              <div style={{ position: 'relative' as any }}>
                <>
                <style dangerouslySetInnerHTML={{ __html: `
                  .components-carousel { -ms-overflow-style: none; scrollbar-width: none; }
                  .components-carousel::-webkit-scrollbar { display: none; }
                ` }} />
                <div ref={componentsCarouselRef} className="components-carousel" style={{ display: 'flex', width: '100%', gap: 12, overflowX: 'auto', paddingBottom: 0, WebkitOverflowScrolling: 'touch' as any, scrollSnapType: 'x mandatory' as any, paddingLeft: 56, paddingRight: 56, boxSizing: 'border-box' as any, scrollPaddingInline: '56px' as any, alignItems: 'flex-start' as any }}>
                  {(['c','p','a','s','t'] as ComponentKey[]).map((compKey, compIndex) => {
                    const ck = compKey as ComponentKey;
                    const skillLabel = skillLabels[currentSkillIndex];
                    const skillRow = skillMap.get(skillLabel);
                    const keyNorm = normalizeKey(skillLabel);
                    const isMovement = keyNorm === 'movement';
                    const hide = isMovement && ['c','p','a','s'].includes(compKey as string);
                    const value = skillRow ? skillRow[ck] : null;
                    const heatStyle = getComponentHeatStyle(skillLabel, String(ck), value);
                    return (
                      <div ref={(el) => { itemRefs.current[compIndex] = el; }} key={compKey} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: componentItemWidth, flex: `0 0 ${componentItemWidth}px`, scrollSnapAlign: 'center' as any }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{componentLabels[ck]}</div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <BandTooltip value={value ?? ''} skill={skillLabel} component={String(ck)} onHover={handleHover}>
                              <span tabIndex={-1} aria-hidden="true" style={{ fontSize: 14, color: '#6b7280', cursor: 'help' }}>ⓘ</span>
                            </BandTooltip>
                          </div>
                        </div>

                        <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 8, background: '#ffffff', boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}>
                          {/* Recognition pattern cards (primary interaction) */}
                          {(() => {
                            try {
                              const skKey = normalizeKey(skillLabel);
                              const compMap: Record<string, string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
                              const canonicalComp = compMap[String(ck)] || String(ck);
                              const skillEntry = (referenceKey as any)[skKey] || (referenceKey as any)[skKey.replace(/\s+/g, '')];
                              const compBands = skillEntry ? (skillEntry[canonicalComp] || skillEntry[String(ck)]) : null;
                              if (!compBands || !Array.isArray(compBands)) return null;

                              return (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'stretch', flexWrap: 'wrap' }}>
                                  {compBands.map((b: any, i: number) => {
                                    const selected = value != null && Number(value) >= b.min && Number(value) <= b.max;
                                    const midpoint = (typeof b.max === 'number' && b.max >= 100) ? 38 : Math.round((b.min + b.max) / 2);
                                    const span = Math.max(1, (b.max - b.min));
                                    const frac = (value != null && Number(value) >= b.min && Number(value) <= b.max) ? Math.max(0, Math.min(1, (Number(value) - b.min) / span)) : 0.5;
                                    const cardHeat = computeBandColor(i, frac);
                                    return (
                                      <div
                                        key={`opt-${ck}-${i}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => updateCell(skillLabel, ck, String(midpoint))}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { updateCell(skillLabel, ck, String(midpoint)); e.preventDefault(); } }}
                                        style={{
                                          border: selected ? '2px solid rgba(0,0,0,0.08)' : '1px solid #e6e6e6',
                                          background: selected ? cardHeat.background : '#fff',
                                          color: selected ? cardHeat.color : '#111',
                                          padding: '8px 10px',
                                          borderRadius: 8,
                                          cursor: 'pointer',
                                          minWidth: 140,
                                          textAlign: 'left',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'space-between',
                                          gap: 8
                                        }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontWeight: 700, fontSize: 13, color: 'inherit' }}>{b.name} <span style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.9)' : '#6b7280', marginLeft: 6 }}>({formatRange(b.min, b.max)})</span></div>
                                          <div style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.95)' : '#6b7280', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.description}</div>
                                        </div>

                                        {selected ? (
                                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <button className="stat-chev" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); changeComponentBy(skillLabel, ck, -1); }} style={{ padding: '0 8px', height: 32, background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center' }}>‹</button>
                                            <input
                                              value={value ?? ''}
                                              onClick={(e) => { e.stopPropagation(); }}
                                              onChange={(e) => { e.stopPropagation(); updateCell(skillLabel, ck, e.target.value); }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'ArrowUp') { e.stopPropagation(); changeComponentBy(skillLabel, ck, 1); e.preventDefault(); }
                                                else if (e.key === 'ArrowDown') { e.stopPropagation(); changeComponentBy(skillLabel, ck, -1); e.preventDefault(); }
                                              }}
                                              style={{ width: 56, height: 32, border: 'none', background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14, textAlign: 'center', padding: '0 6px', margin: '0 4px' }}
                                            />
                                            <button className="stat-chev" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); changeComponentBy(skillLabel, ck, 1); }} style={{ padding: '0 8px', height: 32, background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center' }}>›</button>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } catch (e) { return null; }
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              </div>
            </div>
            {/* external prev/next buttons positioned outside the carousel */}
            <button aria-label="Prev component (outside)" onClick={() => goToComponentIndex(activeComponentIndex - 1)} style={{ position: 'absolute' as any, left: -44, top: '50%', transform: 'translateY(-50%)', zIndex: 30, padding: '6px 8px', background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 16, lineHeight: '1', color: '#111', display: 'inline-block' }}>‹</span>
            </button>
            <button aria-label="Next component (outside)" onClick={() => goToComponentIndex(activeComponentIndex + 1)} style={{ position: 'absolute' as any, right: -44, top: '50%', transform: 'translateY(-50%)', zIndex: 30, padding: '6px 8px', background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 16, lineHeight: '1', color: '#111', display: 'inline-block' }}>›</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              {(['c','p','a','s','t'] as ComponentKey[]).map((_, i) => (
                <button key={i} aria-label={`Component ${i + 1}`} onClick={() => goToComponentIndex(i)} style={{ width: 8, height: 8, borderRadius: 8, border: 'none', background: i === activeComponentIndex ? '#111' : '#e5e7eb', padding: 0, cursor: 'pointer' }} />
              ))}
            </div>
            {/* Quick fill: show when explicitly requested for new-player flow or when no player id */}
            {(showQuickFill || !player?.id) && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#6b7280', minWidth: 64 }}>Quick fill</label>
                <input
                  value={customQuickFill[skillLabels[currentSkillIndex]] ?? ''}
                  onChange={(e) => setCustomQuickFill((p) => ({ ...(p || {}), [skillLabels[currentSkillIndex]]: e.target.value }))}
                  placeholder="e.g. 20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = Number((customQuickFill[skillLabels[currentSkillIndex]] ?? '').trim());
                      if (!Number.isNaN(v)) computeAndApplyQuickFillForSkill(skillLabels[currentSkillIndex], Math.round(v));
                    }
                  }}
                  style={{ padding: 8, width: 96 }}
                />
                <button onClick={() => {
                  const v = Number((customQuickFill[skillLabels[currentSkillIndex]] ?? '').trim());
                  if (!Number.isNaN(v)) computeAndApplyQuickFillForSkill(skillLabels[currentSkillIndex], Math.round(v));
                }} style={{ padding: '8px 10px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Apply</button>
              </div>
            )}
            {/* Archetype controls: only shown when explicitly enabled (add-player flow) */}
            {(showArchetypes || !player?.id) && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button title="Load archetypes (built-in + generated)" aria-label="Load archetypes" onClick={() => loadArchetypes()} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: 2, background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }} />
                  <span>Archetypes</span>
                </button>
                <select value={selectedArchetypeName ?? ''} onChange={(e) => setSelectedArchetypeName(e.target.value === '' ? null : e.target.value)} style={{ padding: 6 }}>
                  <option value="">— archetype —</option>
                  {(archetypesBySkill?.[skillLabels[currentSkillIndex]] || []).filter((a: any) => (a?.name ?? '') !== 'Archetype 1').map((a: any, idx: number) => (
                    <option key={idx} value={a.name}>{a.name}</option>
                  ))}
                </select>
                <button onClick={() => {
                  const sel = selectedArchetypeName;
                  const arr = archetypesBySkill?.[skillLabels[currentSkillIndex]] || [];
                  const arche = sel ? arr.find((x: any) => x?.name === sel) : null;
                  if (!arche) { setError('Select an archetype first'); return; }
                  try {
                    // dynamic require to avoid SSR issues
                    // @ts-ignore
                    const mod = require('../utils/archetypes');
                    // determine quick-fill value: prefer explicit quick-fill, otherwise use current skill overall
                    const qRaw = (customQuickFill[skillLabels[currentSkillIndex]] ?? '').toString().trim();
                    let qv: number | null = qRaw === '' ? null : Number(qRaw);
                    if (qv == null) {
                      const skillRow: any = skillMap.get(skillLabels[currentSkillIndex]);
                      if (skillRow) {
                        const key = normalizeKey(skillLabels[currentSkillIndex]);
                        if (key === 'movement') {
                          qv = skillRow.t != null ? Number(skillRow.t) : null;
                        } else {
                          const present = ['c','p','a','s','t'].map((k) => skillRow[k]).filter((v) => v != null).map((v) => Number(v));
                          qv = present.length ? Math.round(present.reduce((a,b) => a + b, 0) / present.length) : null;
                        }
                      }
                    }

                    const toUse = (qv != null && !Number.isNaN(qv)) ? (
                      (mod.scaleArchetypeToOverallWithBounds ? mod.scaleArchetypeToOverallWithBounds(arche, Math.round(qv), skillLabels[currentSkillIndex], 0.3) :
                      (mod.scaleArchetypeToMatchOverall ? mod.scaleArchetypeToMatchOverall(arche, Math.round(qv), skillLabels[currentSkillIndex]) :
                      (mod.scaleArchetypeTemplate ? mod.scaleArchetypeTemplate(arche, Math.round(qv), skillLabels[currentSkillIndex]) : arche)))
                    ) : arche;
                    const updated = mod.applyArchetypeToRows(rows, skillLabels[currentSkillIndex], toUse);
                    setRows(updated);
                  } catch (e) { console.error(e); setError('Failed to apply archetype'); }
                }} style={{ padding: '6px 8px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Apply archetype</button>
              </div>
            )}
          </div>

          <div style={{ width: '100%', boxSizing: 'border-box', maxWidth: 359 }}>
            <div className="band-key-panel" style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', gap: 32, position: 'relative', background: '#D9D9D9', border: '2.65693px solid rgba(0,0,0,0.23)', borderRadius: 10 }}
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

        <div style={{ marginTop: 6 }}>
          {navSlot ? (
            navSlot
          ) : (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
              {selectedSessionId && !hideDelete && (
                  <button className="text-btn" onClick={deleteSelectedSession} disabled={loading} style={{ padding: "4px 8px", background: "transparent", color: "#ef4444", border: "none" }}>
                    {loading ? "Deleting..." : "Delete session"}
                  </button>
                )}
                {showSaveButton && (
                  <button className="text-btn" onClick={submit} disabled={loading} style={{ padding: "4px 8px", background: "transparent", color: "var(--accent)", border: "none", fontWeight: 600 }}>
                    {loading ? "Saving..." : "Save session"}
                  </button>
                )}
            </div>
          )}
        </div>
      </div>
  );

  return renderInner();
});
