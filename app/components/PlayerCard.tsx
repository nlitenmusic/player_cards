"use client";
import React, { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { getTierColor, getMacroTier, macroTiers, MICRO, computeBandColor } from "../lib/tiers";
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
    try {
      if (Array.isArray(rowsRaw)) {
        return Number(rowsRaw[idx] ?? 0);
      }
      const candidates = [
        label,
        label.toLowerCase(),
        normalizeKey(label),
        normalizeKey(label).replace(/\s+/g, ''),
        label.replace(/\s+/g, '_').toLowerCase(),
        label.replace(/\s+/g, '').toLowerCase()
      ].filter(Boolean);

      for (const k of candidates) {
        if (!Object.prototype.hasOwnProperty.call(rowsRaw, k)) continue;
        const raw = (rowsRaw as any)[k];
        if (raw == null) continue;
        if (typeof raw === 'object') {
          const nums = Object.values(raw).map((x) => toNumber(x)).filter((n) => n !== null) as number[];
          if (nums.length > 0) return round2(nums.reduce((a, b) => a + b, 0) / nums.length);
          continue;
        }
        const n = Number(raw);
        if (!Number.isNaN(n)) return n;
      }

      // fallback: common top-level fields for movement
      const alt = (player as any)?.movement ?? (player as any)?.movement_score ?? (player as any)?.movementScore;
      if (typeof alt === 'number') return alt;
      return 0;
    } catch (e) {
      return 0;
    }
  });

  // compact skill-cluster removed; legacy flag deleted

  const level = Math.floor(Math.max(0, ratingNum) / MICRO);
  const levelStart = level * MICRO;
  const levelProgressPct = Math.max(0, Math.min(100, ((ratingNum - levelStart) / MICRO) * 100));

  const macro = getMacroTier(ratingNum);
  const tierName = macro.name;
  const nextMacro = macroTiers[macro.index + 1] ?? macro;
  const nextTierLevel = nextMacro.min;

  // Use the numeric rating for heatmap color so overall matches per-skill heat mapping
  const rankColor = getTierColor(ratingNum);

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

  function summarizeDescription(text: string | undefined | null, limit = 6) {
    if (!text) return '';
    const s = String(text).trim();
    const firstSentenceMatch = s.match(/^(.*?)[\.\!\?;]/);
    const first = firstSentenceMatch ? firstSentenceMatch[1].trim() : s;
    const words = first.replace(/\s+/g, ' ').split(' ').filter(Boolean);
    if (words.length <= limit) return words.join(' ');
    return words.slice(0, limit).join(' ') + '…';
  }

  function getOverallBand(skill: string, value: number) {
    try {
      const sk = normalizeKey(skill);
      const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
      if (!skillEntry) return { name: 'Unknown', description: '' };
      const compCandidates = ['consistency', 'technique', 'power', 'accuracy', 'spin'];
      const v = Number(value);
      if (Number.isNaN(v)) return { name: 'Unknown', description: '' };
      const vLookup = Math.floor(v);
      for (const comp of compCandidates) {
        const bands = (skillEntry as any)[comp];
        if (!bands || !Array.isArray(bands) || bands.length === 0) continue;
        let bandIdx = bands.findIndex((b: any) => vLookup >= b.min && vLookup <= b.max);
        if (bandIdx === -1) {
          const mids = bands.map((b: any) => ((Number(b.min) + Number(b.max)) / 2));
          let best = 0;
          let bestDist = Math.abs(v - mids[0]);
          for (let i = 1; i < mids.length; i++) {
            const d = Math.abs(v - mids[i]);
            if (d < bestDist) { bestDist = d; best = i; }
          }
          bandIdx = best;
        }
        const band = bands[bandIdx];
        return { name: band.name || 'Band', description: band.description || '' };
      }
      return { name: 'Unknown', description: '' };
    } catch (e) {
      return { name: 'Unknown', description: '' };
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

  const [expandedInfo, setExpandedInfo] = useState<{ label: string; score: number; band: any } | null>(null);

  useEffect(() => {
    if (!expandedInfo) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpandedInfo(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expandedInfo]);

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
      {/* avatar in top-right (absolute) */}

      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 6 }}>
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
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
            <AvatarUpload playerId={player.id} currentAvatar={avatarUrl} onUploaded={(url)=>setAvatarUrl(url)} />
          </div>
        ) : null}
      </div>
      {/* overall rating moved below the avatar (see header) */}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 6 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--card-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.first_name || ''}</div>
          { (player.last_name && String(player.last_name).trim() !== '') ? (
            <div style={{ fontSize: 10, color: 'var(--card-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.last_name}</div>
          ) : null }
          {/* achievements rendered below the skill cluster */}

          <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: rankColor }}>{tierName}</div>
                <div title="Court Sense Rating" style={{ fontSize: 12, fontWeight: 800, color: rankColor }}>{Number.isFinite(ratingNum) ? `${Number(ratingNum).toFixed(1)} CSR` : `${ratingNum} CSR`}</div>
              </div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
              {prevLevelProgressPct !== null && (
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.round(prevLevelProgressPct)}%`, pointerEvents: 'none', transition: 'width 300ms ease' }}>
                  <div style={{ height: '100%', width: '100%', background: (sessionChangePct !== null && sessionChangePct > 0) ? 'rgba(16,165,130,0.22)' : (sessionChangePct !== null && sessionChangePct < 0) ? 'rgba(239,68,68,0.18)' : 'rgba(0,0,0,0.08)', borderRadius: 4 }} />
                </div>
              )}
              <div style={{ width: `${Math.round(levelProgressPct)}%`, height: '100%', background: rankColor, transition: 'width 300ms ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }} aria-hidden>
              <div title={`Progress to ${nextMacro.name ?? 'next tier'}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: rankColor, marginRight: 8 }}>{Math.max(0, Math.min(100, Math.round(levelProgressPct)))}%</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>to {nextMacro.name ?? 'next tier'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* rating moved below avatar so tier/progress can span remaining width */}
      </div>

      {/* Skill cluster removed */}

        {/* Skill detail rows: show overall numeric value + band description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {skillLabels.map((label, idx) => {
            const scoreRaw = skillScores[idx] ?? 0;
            const score = Number.isFinite(scoreRaw) ? Number(scoreRaw).toFixed(1) : scoreRaw;
            const band = getOverallBand(label, scoreRaw);
            const summary = summarizeDescription(band.description, 6);
            const heat = getSkillHeatStyle(label, scoreRaw) || { background: 'var(--card-row-bg, #efefef)', color: '#111', chipBg: 'rgba(255,255,255,0.96)', chipBorder: 'rgba(0,0,0,0.06)', chipShadow: '0 6px 14px rgba(0,0,0,0.06)' };
            const rowBg = heat.chipBg || heat.background || 'var(--card-row-bg, #efefef)';
            // ensure readable text on chip backgrounds (chips are light), use a dark neutral
            const textColor = '#0f172a';
            return (
              <div
                key={label}
                role="button"
                tabIndex={0}
                aria-label={`Open ${label} details`}
                onClick={() => setExpandedInfo({ label, score: scoreRaw, band })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedInfo({ label, score: scoreRaw, band }); } }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 4,
                  background: heat.chipBg || 'rgba(255,255,255,0.96)',
                  borderRadius: 16,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  height: 44,
                  minHeight: 44,
                  maxHeight: 44,
                  overflow: 'hidden',
                  position: 'relative',
                  border: `2px solid ${heat.chipBorder || 'rgba(0,0,0,0.06)'}`,
                  boxShadow: heat.chipShadow || '0 6px 14px rgba(0,0,0,0.06)',
                  backdropFilter: 'blur(6px)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12 }}>
                  <div style={{ width: 64, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: heat.background }}>{score}</div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingRight: 40 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                  </div>
                </div>
                {/* decorative info icon anchored to right-center inside chip (click falls through to chip) */}
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.72, pointerEvents: 'none' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.75 6a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM11 11h2v6h-2v-6z" fill={heat.background} />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {expandedInfo && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${expandedInfo.label} full description`}
            onClick={() => setExpandedInfo(null)}
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, background: 'rgba(2,6,23,0.48)' }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(92%,420px)', background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 20px 50px rgba(2,6,23,0.28)', color: '#0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{expandedInfo.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: getSkillHeatStyle(expandedInfo.label, expandedInfo.score)?.background || '#111' }}>{Number.isFinite(expandedInfo.score) ? Number(expandedInfo.score).toFixed(1) : expandedInfo.score}</div>
              </div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{expandedInfo.band?.name}</div>
              <div style={{ color: '#334155', lineHeight: 1.4 }}>{expandedInfo.band?.description}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <button onClick={() => setExpandedInfo(null)} style={{ fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}

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
          {isAdmin && (
            <button onClick={toggleFavorite} aria-pressed={isFavorited} title={isFavorited ? 'Unfavorite' : 'Favorite'} style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: isFavorited ? '#fef3c7' : 'var(--card-bg)', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorited ? 'gold' : 'none'} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          )}
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