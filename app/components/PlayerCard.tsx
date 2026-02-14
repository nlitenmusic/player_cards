"use client";
import React, { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { getTierColor, getMacroTier, macroTiers, MICRO } from "../lib/tiers";
import referenceKey, { normalizeKey } from "../lib/referenceKey";
import AvatarUpload from "./AvatarUpload";
import { supabase } from "../lib/supabaseClient";
// AchievementBadge removed; badges hidden in admin card

interface PlayerCardProps {
  player: any;
  isAdmin?: boolean;
  isTop?: boolean;
  maxStats?: Record<string, number>;
  onAddStats?: (player:any)=>void;
  onEditPlayer?: (player:any)=>void;
  showAvatarUpload?: boolean;
  showSessions?: boolean;
  prefetchedAchievements?: Record<string, any[]>;
}

export default function PlayerCard({
  player,
  isAdmin = false,
  isTop = false,
  maxStats,
  onAddStats,
  onEditPlayer,
  showAvatarUpload = true,
  showSessions = true,
  prefetchedAchievements,
}: PlayerCardProps) {
  
  const sessionsCount = player.sessions_count ?? (player.sessions || []).length ?? 0;
  const avg = player.avg_rating ?? 0;
  const ratingNum = typeof avg === "number" ? avg : Number(avg) || 0;

  // normalize row_averages: accept either ordered array or keyed object { Serve: n, serve: n, ... }
  const rowsRaw = player.row_averages ?? player.rowAverages ?? player.rowAveragesByName ?? [];
  const skillLabels = ["Serve", "Return", "Forehand", "Backhand", "Volley", "Overhead", "Movement"];
  const skillScores = skillLabels.map((label, idx) => {
    if (Array.isArray(rowsRaw)) {
      return Number(rowsRaw[idx] ?? 0);
    }
    // try multiple normalizations for keys
    const v = rowsRaw[label] ?? rowsRaw[label.toLowerCase()] ?? rowsRaw[label.replace(/\s+/g,'_').toLowerCase()];
    return Number(v ?? 0);
  });

  const level = Math.floor(Math.max(0, ratingNum) / MICRO);
  const levelStart = level * MICRO;
  const levelProgressPct = Math.max(0, Math.min(100, ((ratingNum - levelStart) / MICRO) * 100));

  const macro = getMacroTier(ratingNum);
  const tierName = macro.name;
  const nextMacro = macroTiers[macro.index + 1] ?? macro;
  const nextTierLevel = nextMacro.min;

  const rankColor = getTierColor(tierName);

  // canonical player id to use in links (fallbacks for different shapes)
  const pidForLinks = player?.id ?? player?.playerId ?? player?.player_id ?? '';

  function hexToRgb(hex: string) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }
  function mixWithWhite(hex: string, amount = 0.86) {
    const { r, g, b } = hexToRgb(hex);
    const rr = Math.round(r + (255 - r) * amount);
    const gg = Math.round(g + (255 - g) * amount);
    const bb = Math.round(b + (255 - b) * amount);
    return `rgb(${rr}, ${gg}, ${bb})`;
  }
  const cardBg = mixWithWhite(rankColor, 0.86);

  function isTopStat(skillName: string, value: number) {
    if (!maxStats) return false;
    const top = maxStats[skillName] ?? 0;
    return Math.abs((value ?? 0) - top) < 1e-6;
  }

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

  function getSkillHeatStyle(skill: string, value: number) {
    try {
      const sk = normalizeKey(skill);
      const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
      if (!skillEntry) return null;
      // prefer these components in order when deriving an overall band
      const compCandidates = ['consistency', 'technique', 'power', 'accuracy', 'spin'];
      const v = Number(value);
      if (Number.isNaN(v)) return null;
      // Use integer lookup for band selection so fractional values (e.g. 18.87)
      // map to the band that contains their floor value (18 -> 13-18)
      const vLookup = Math.floor(v);
      for (const comp of compCandidates) {
        const bands = (skillEntry as any)[comp];
        if (!bands || !Array.isArray(bands) || bands.length === 0) continue;
        let bandIdx = bands.findIndex((b: any) => vLookup >= b.min && vLookup <= b.max);
        // if no exact match, choose the nearest band's midpoint (defensive fallback)
        if (bandIdx === -1) {
          try {
            const mids = bands.map((b: any) => ((Number(b.min) + Number(b.max)) / 2));
            let best = 0;
            let bestDist = Math.abs(v - mids[0]);
            for (let i = 1; i < mids.length; i++) {
              const d = Math.abs(v - mids[i]);
              if (d < bestDist) { bestDist = d; best = i; }
            }
            bandIdx = best;
          } catch (e) {
            bandIdx = v < bands[0].min ? 0 : bands.length - 1;
          }
        }
        const band = bands[bandIdx];
        const span = Math.max(1, (band.max - band.min));
        // Use full-precision v to compute fractional position inside the band
        const frac = Math.max(0, Math.min(1, (v - band.min) / span));
        return computeBandColor(bandIdx, frac);
      }
      // fallback: if no component bands found, return a neutral swatch
      return computeBandColor(0, 0.5);
    } catch (e) {
      return null;
    }
  }

  // helpers to compute per-session skill values (mirror server logic)
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
        const tv = toNumber(r.t);
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

  // determine direction arrows by comparing the two most recent sessions (if available)
  const sessions = (player.sessions || []).slice().sort((a:any,b:any)=>{
    const da = a.session_date ? new Date(a.session_date) : new Date(0);
    const db = b.session_date ? new Date(b.session_date) : new Date(0);
    return db.getTime() - da.getTime();
  });
  let directionMap: Record<string, -1|0|1> = {};
  let deltaMap: Record<string, number | null> = {};
  // session-based progress estimates (percent within level)
  let recentLevelProgressPct: number | null = null;
  let prevLevelProgressPct: number | null = null;
  let sessionChangePct: number | null = null;
  if (sessions.length >= 2) {
    const recent = computeSessionSkillMap(sessions[0]);
    const prev = computeSessionSkillMap(sessions[1]);
    for (let i=0;i<skillLabels.length;i++) {
      const key = skillLabels[i].toLowerCase();
      const r = recent[key];
      const p = prev[key];
      if (r == null || p == null) { directionMap[key]=0; deltaMap[key]=null; continue; }
      const diff = round2(Number(r) - Number(p));
      deltaMap[key] = diff;
      if (diff > 0) directionMap[key]=1;
      else if (diff < 0) directionMap[key]=-1;
      else directionMap[key]=0;
    }
    // estimate overall progress pct for the two most recent sessions
    const recentVals = skillLabels.map((l) => recent[l.toLowerCase()]).filter((n) => typeof n === 'number') as number[];
    const prevVals = skillLabels.map((l) => prev[l.toLowerCase()]).filter((n) => typeof n === 'number') as number[];
    let recentOverallEst: number | null = null;
    let prevOverallEst: number | null = null;
    if (recentVals.length > 0) recentOverallEst = round2(recentVals.reduce((a,b)=>a+b,0)/recentVals.length);
    if (prevVals.length > 0) prevOverallEst = round2(prevVals.reduce((a,b)=>a+b,0)/prevVals.length);
    if (typeof recentOverallEst === 'number') {
      const lev = Math.floor(Math.max(0, recentOverallEst) / MICRO);
      const start = lev * MICRO;
      recentLevelProgressPct = Math.max(0, Math.min(100, ((recentOverallEst - start) / MICRO) * 100));
    }
    if (typeof prevOverallEst === 'number') {
      const lev = Math.floor(Math.max(0, prevOverallEst) / MICRO);
      const start = lev * MICRO;
      prevLevelProgressPct = Math.max(0, Math.min(100, ((prevOverallEst - start) / MICRO) * 100));
    }
    if (recentLevelProgressPct !== null && prevLevelProgressPct !== null) {
      sessionChangePct = round2(recentLevelProgressPct - prevLevelProgressPct);
    }
  }

  // fetch achievements for display on player cards (show all badges under skill cluster)
  const [achievements, setAchievements] = useState<any[]>([]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((player as any).avatar_url ?? null);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<'report'|'add'|null>(null);

  // favorites stored in localStorage under this key (admin-only client-side)
  const FAVORITES_KEY = 'pc_admin_favorites_v1';

  useEffect(() => {
    try {
      const pid = String(player?.id ?? player?.playerId ?? player?.player_id ?? '');
      if (!pid) return;
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(FAVORITES_KEY) : null;
      const favs = raw ? JSON.parse(raw) : [];
      setIsFavorited(Array.isArray(favs) && favs.includes(pid));
    } catch (e) {
      // ignore
    }
  }, [player?.id, player?.playerId, player?.player_id]);

  function toggleFavorite() {
    try {
      const pid = String(player?.id ?? player?.playerId ?? player?.player_id ?? '');
      if (!pid) return;
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      const favs = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(favs) ? favs.map((x:any)=>String(x)) : []);
      if (set.has(pid)) set.delete(pid);
      else set.add(pid);
      const out = Array.from(set);
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(out));
      setIsFavorited(set.has(pid));
      // notify other components (PlayerSearch) to recompute filters
      try { window.dispatchEvent(new Event('pc_favorites_changed')); } catch (e) {}
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true;
    setIsOwnerLoading(true);
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        if (!mounted) return;
        setCurrentUser(user);
        const userEmail = user?.email ?? null;
        const supaId = user?.id ?? null;
        const playerEmail = (player as any).email ?? null;
        const playerSupaId = (player as any).supabase_user_id ?? null;

        // base owner check (email or players.supabase_user_id)
        let owner = !!(
          (userEmail && playerEmail && userEmail.toLowerCase() === String(playerEmail).toLowerCase()) ||
          (supaId && playerSupaId && supaId === playerSupaId)
        );

        // if not owner yet, check player_access via server endpoint (handles multiple approved users)
        if (!owner && supaId) {
          try {
            const res = await fetch('/api/account/approved', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ requester_id: supaId }),
            });
            if (res.ok) {
              const j = await res.json();
              const players = j.players || [];
              const pid = player?.id ?? player?.playerId ?? player?.player_id ?? null;
              if (pid && Array.isArray(players) && players.find((p: any) => String(p.id) === String(pid))) {
                owner = true;
              }
            }
          } catch (e) {
            // ignore endpoint errors; keep owner as computed
          }
        }

        if (mounted) setIsOwner(Boolean(owner));
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setIsOwnerLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [player?.id]);

  useEffect(() => {
    const pid = player?.id ?? player?.playerId ?? null;
    if (!pid) return;
    let cancelled = false;
    // If parent provided prefetched achievements, use them and skip network fetch
    const pidKey = String(pid);
    if (prefetchedAchievements && Object.prototype.hasOwnProperty.call(prefetchedAchievements, pidKey)) {
      setAchievements(Array.isArray(prefetchedAchievements[pidKey]) ? prefetchedAchievements[pidKey] : []);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/achievements/player?player_id=${encodeURIComponent(String(pid))}`);
        const j = await res.json();
        if (cancelled) return;
        const ach = (j.achievements || []);
        setAchievements(Array.isArray(ach) ? ach : []);
      } catch (e) {
        if (!cancelled) setAchievements([]);
      }
    })();
    return () => { cancelled = true; };
  }, [player?.id, prefetchedAchievements]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 180,
        background: 'var(--card-bg)',
        color: 'var(--card-fg)',
        boxSizing: 'border-box',
        borderRadius: 8,
        overflow: 'hidden',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        border: '1px solid var(--border)'
      }}
    >
      {/* admin favorite button placed in the top-right so score aligns with progress */}
      {isAdmin && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 6 }}>
          <button onClick={toggleFavorite} aria-pressed={isFavorited} title={isFavorited ? 'Unfavorite' : 'Favorite'} style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: isFavorited ? '#fef3c7' : 'var(--card-bg)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorited ? 'gold' : 'none'} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        </div>
      )}
      {/* overall rating moved below the avatar (see header) */}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: mixWithWhite(rankColor, 0.7), border: `3px solid ${rankColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div aria-hidden style={{ display: 'block', width: '100%', height: '100%' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: 42, height: 42, borderRadius: 21, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 42, height: 42, borderRadius: 21, background: '#8E8E8E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 12c2.485 0 4.5-2.015 4.5-4.5S14.485 3 12 3 7.5 5.015 7.5 7.5 9.515 12 12 12z" fill="#fff" />
                    <path d="M4.5 20.25c0-3.038 2.962-5.5 7.5-5.5s7.5 2.462 7.5 5.5V21H4.5v-.75z" fill="#fff" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          {isAdmin && showAvatarUpload ? (
            <div style={{ marginTop: 6 }}>
              <AvatarUpload playerId={player.id} currentAvatar={avatarUrl} onUploaded={(url)=>setAvatarUrl(url)} />
            </div>
          ) : null}
          {/* claim requests moved to user Account page (no badge on homepage) */}
          <div title="Court Sense Rating" style={{ fontSize: 14, fontWeight: 700, color: 'var(--card-fg)' }}>{Number.isFinite(ratingNum) ? `${Number(ratingNum).toFixed(1)} CSR` : `${ratingNum} CSR`}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--card-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.first_name || ''}</div>
          { (player.last_name && String(player.last_name).trim() !== '') ? (
            <div style={{ fontSize: 10, color: 'var(--card-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.last_name}</div>
          ) : null }
          {/* achievements rendered below the skill cluster */}
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>{tierName}</div>

          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }} aria-hidden>
              <div title={`${Math.max(0, Math.min(100, Math.round(levelProgressPct)))}% towards ${nextMacro.name ?? 'next tier'}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: rankColor, marginRight: 6 }}>{Math.max(0, Math.min(100, Math.round(levelProgressPct)))}%</div>
                {sessionChangePct !== null ? (
                  <div style={{ fontSize: 11, fontWeight: 700, color: sessionChangePct > 0 ? '#16a34a' : (sessionChangePct < 0 ? '#dc2626' : '#6b7280') }}>{sessionChangePct > 0 ? `+${sessionChangePct}%` : `${sessionChangePct}%`}</div>
                ) : null}
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
              {prevLevelProgressPct !== null && (
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.round(prevLevelProgressPct)}%`, pointerEvents: 'none', transition: 'width 300ms ease' }}>
                  <div style={{ height: '100%', width: '100%', background: (sessionChangePct !== null && sessionChangePct > 0) ? 'rgba(16,165,130,0.22)' : (sessionChangePct !== null && sessionChangePct < 0) ? 'rgba(239,68,68,0.18)' : 'rgba(0,0,0,0.08)', borderRadius: 4 }} />
                </div>
              )}
              <div style={{ width: `${Math.round(levelProgressPct)}%`, height: '100%', background: rankColor, transition: 'width 300ms ease' }} />
            </div>
          </div>
        </div>

        {/* rating moved below avatar so tier/progress can span remaining width */}
      </div>

      {/* Skill cluster: 2-3-2 pentagon-like layout (top 2, middle 3, bottom 2) */}
      <div style={{ width: '100%', maxWidth: 160, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {skillLabels.slice(0,2).map((label, idx) => {
              const i = idx;
              const scoreRaw = skillScores[i] ?? 0;
              const score = Number.isFinite(scoreRaw) ? Number(scoreRaw).toFixed(1) : scoreRaw;
              const heat = getSkillHeatStyle(label, scoreRaw);
              const bg = heat?.background ?? '#efefef';
              const fg = heat?.color ?? '#000';
              return (
                <div key={label} style={{ flex: '0 0 34%', maxWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '0 2%' }}>
                  <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: fg, fontWeight: 700 }}>{score}</div>
                    {((directionMap[label.toLowerCase()] ?? 0) !== 0) && (
                      <div
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                        title={((deltaMap[label.toLowerCase()] ?? null) !== null) ? `${(deltaMap[label.toLowerCase()]! > 0 ? '+' : '')}${deltaMap[label.toLowerCase()]}` : (directionMap[label.toLowerCase()] === 1 ? 'Up' : 'Down')}
                      >
                        {directionMap[label.toLowerCase()] === 1 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 8l4 4H8l4-4z" fill="#16a34a" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 16l-4-4h8l-4 4z" fill="#dc2626" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: 'var(--card-fg)', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>{label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            {skillLabels.slice(2,5).map((label, idx) => {
              const i = 2 + idx;
              const scoreRaw = skillScores[i] ?? 0;
              const score = Number.isFinite(scoreRaw) ? Number(scoreRaw).toFixed(1) : scoreRaw;
              const heat = getSkillHeatStyle(label, scoreRaw);
              const bg = heat?.background ?? '#efefef';
              const fg = heat?.color ?? '#000';
              return (
                <div key={label} style={{ flex: '0 0 30%', maxWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: fg, fontWeight: 700 }}>{score}</div>
                    {((directionMap[label.toLowerCase()] ?? 0) !== 0) && (
                      <div
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                        title={((deltaMap[label.toLowerCase()] ?? null) !== null) ? `${(deltaMap[label.toLowerCase()]! > 0 ? '+' : '')}${deltaMap[label.toLowerCase()]}` : (directionMap[label.toLowerCase()] === 1 ? 'Up' : 'Down')}
                      >
                        {directionMap[label.toLowerCase()] === 1 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 8l4 4H8l4-4z" fill="#16a34a" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 16l-4-4h8l-4 4z" fill="#dc2626" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: 'var(--card-fg)', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>{label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {skillLabels.slice(5,7).map((label, idx) => {
              const i = 5 + idx;
              const scoreRaw = skillScores[i] ?? 0;
              const score = Number.isFinite(scoreRaw) ? Number(scoreRaw).toFixed(1) : scoreRaw;
              const heat = getSkillHeatStyle(label, scoreRaw);
              const bg = heat?.background ?? '#efefef';
              const fg = heat?.color ?? '#000';
              return (
                <div key={label} style={{ flex: '0 0 34%', maxWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '0 2%' }}>
                  <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: fg, fontWeight: 700 }}>{score}</div>
                    {((directionMap[label.toLowerCase()] ?? 0) !== 0) && (
                      <div
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                        title={((deltaMap[label.toLowerCase()] ?? null) !== null) ? `${(deltaMap[label.toLowerCase()]! > 0 ? '+' : '')}${deltaMap[label.toLowerCase()]}` : (directionMap[label.toLowerCase()] === 1 ? 'Up' : 'Down')}
                      >
                        {directionMap[label.toLowerCase()] === 1 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 8l4 4H8l4-4z" fill="#16a34a" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 16l-4-4h8l-4 4z" fill="#dc2626" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: 'var(--card-fg)', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Link to achievements screen: display above the skill cluster when player has achievements */}
      {/* achievements button moved into footer row to align with report and breakdown */}

      {/* Footer: left (sessions/admin) and right (skill breakdown + add) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minHeight: 18, display: 'flex', alignItems: 'center' }}>
          {isAdmin ? (
            <button
              type="button"
              aria-label="View sessions"
              title="View sessions"
              onClick={() => { try { window.location.href = `/sessions/view?player_id=${encodeURIComponent(String(pidForLinks))}`; } catch (e) { window.location.href = `/sessions/view?player_id=${encodeURIComponent(String(pidForLinks))}`; } }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--card-fg)', cursor: 'pointer', fontSize: 11 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 8h18M7 4v4M17 4v4M5 20h14V8H5v12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span style={{ fontSize: 11 }}>{sessionsCount}</span>
            </button>
          ) : (
            <div style={{ width: 10 }} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8 }}>
          {(isAdmin || isOwner) ? (
            <button
              onClick={() => {
                setLoadingAction('report');
                // allow a short tick for React to render the loading state
                setTimeout(() => {
                  try {
                    window.location.href = `/player/${encodeURIComponent(String(pidForLinks))}/progress`;
                  } catch (e) {
                    window.location.href = `/player/${encodeURIComponent(String(pidForLinks))}/progress`;
                  }
                }, 50);
                // fallback clear in case navigation doesn't occur immediately
                setTimeout(() => setLoadingAction(null), 2000);
              }}
              title="Development Report"
              aria-label="Development Report"
              style={{ fontSize: 11, color: 'var(--card-fg)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
            >
              {loadingAction === 'report' ? (
                <svg width="14" height="14" viewBox="0 0 50 50" aria-hidden>
                  <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <rect x="8" y="13" width="2" height="5" fill="currentColor" />
                  <rect x="11" y="10" width="2" height="8" fill="currentColor" />
                  <rect x="14" y="15" width="2" height="3" fill="currentColor" />
                </svg>
              )}
            </button>
            ) : (
              isOwnerLoading ? (
              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: '1px solid transparent' }}>
                <svg width="14" height="14" viewBox="0 0 50 50" aria-hidden>
                  <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            ) : (
              !isAdmin && (
                <button
                  type="button"
                  aria-label="Skill breakdown"
                  title="Skill breakdown"
                  onClick={() => { try { window.location.href = `/sessions/breakdown?player_id=${encodeURIComponent(String(pidForLinks))}`; } catch (e) { window.location.href = `/sessions/breakdown?player_id=${encodeURIComponent(String(pidForLinks))}`; } }}
                  style={{ fontSize: 11, color: 'var(--card-fg)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="4" y="10" width="3" height="8" rx="0.5" fill="currentColor" />
                    <rect x="10.5" y="6" width="3" height="12" rx="0.5" fill="currentColor" />
                    <rect x="17" y="2" width="3" height="16" rx="0.5" fill="currentColor" />
                  </svg>
                </button>
              )
            )
          )}

          {/* achievements button (non-admin) placed inline with report/breakdown */}
          {!isAdmin && achievements && achievements.length > 0 && (
            <button
              type="button"
              aria-label="View achievements"
              title="View achievements"
              onClick={() => { try { window.location.href = `/achievements/player/${encodeURIComponent(String(pidForLinks))}`; } catch (e) { window.location.href = `/achievements/player/${encodeURIComponent(String(pidForLinks))}`; } }}
              style={{ fontSize: 11, color: 'var(--card-fg)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1-4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor" />
              </svg>
            </button>
          )}

          {/* inline admin add-session control (small plus) */}
          {(isAdmin || isOwner) ? (
            <button
              type="button"
              aria-label="Add session"
              title="Add session"
              onClick={() => {
                setLoadingAction('add');
                // give React a small window to render loading affordance before navigation
                if (typeof onAddStats === 'function') {
                  setTimeout(() => {
                    try { onAddStats(player); } catch (e) { /* ignore */ }
                  }, 50);
                } else {
                  setTimeout(() => {
                    try {
                      const pid = player?.id ?? player?.playerId ?? player?.player_id ?? '';
                      const suffix = '&return_to=/admin';
                      if (typeof window !== 'undefined') window.location.href = `/sessions/new?player_id=${encodeURIComponent(String(pid))}${suffix}`;
                    } catch (e) {
                      // ignore
                    }
                  }, 50);
                }
                setTimeout(() => setLoadingAction(null), 2000);
              }}
              style={{ width: 34, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--card-fg)', padding: 0 }}
            >
              {loadingAction === 'add' ? (
                <svg width="12" height="12" viewBox="0 0 50 50" aria-hidden>
                  <circle cx="25" cy="25" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="25.12 25.12">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor" />
                </svg>
              )}
            </button>
          ) : (
            isOwnerLoading ? (
              <div style={{ width: 34, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid transparent', color: 'var(--muted)', fontSize: 11 }}>
                <svg width="16" height="16" viewBox="0 0 50 50" aria-hidden>
                  <circle cx="25" cy="25" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="25.12 25.12">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            ) : null
          )}
        </div>
      </div>
      {/* absolute floating control removed to avoid duplicate clickable surfaces and z-index issues */}
    </div>
  );
}