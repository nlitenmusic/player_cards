'use client';
import React, { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { getTierColor, getMacroTier, macroTiers, MICRO } from "../lib/tiers";
import referenceKey, { normalizeKey } from "../lib/referenceKey";
// AchievementBadge removed; badges hidden in admin card

interface PlayerCardProps {
  player: any;
  isAdmin?: boolean;
  isTop?: boolean;
  maxStats?: Record<string, number>;
  onAddStats?: (player:any)=>void;
  onEditPlayer?: (player:any)=>void;
  showSessions?: boolean;
}

export default function PlayerCard({
  player,
  isAdmin = false,
  isTop = false,
  maxStats,
  onAddStats,
  onEditPlayer,
  showSessions = true,
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
      for (const comp of compCandidates) {
        const bands = (skillEntry as any)[comp];
        if (!bands || !Array.isArray(bands) || bands.length === 0) continue;
        let bandIdx = bands.findIndex((b: any) => v >= b.min && v <= b.max);
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
  if (sessions.length >= 2) {
    const recent = computeSessionSkillMap(sessions[0]);
    const prev = computeSessionSkillMap(sessions[1]);
    for (let i=0;i<skillLabels.length;i++) {
      const key = skillLabels[i].toLowerCase();
      const r = recent[key];
      const p = prev[key];
      if (r == null || p == null) { directionMap[key]=0; continue; }
      if (r > p) directionMap[key]=1;
      else if (r < p) directionMap[key]=-1;
      else directionMap[key]=0;
    }
  }

  // badges/achievements intentionally disabled for Figma admin view
  const [hasBadge, setHasBadge] = useState(false);
  const [badgeIcon, setBadgeIcon] = useState<string | null>(null);

  useEffect(() => {
    // fetch player achievements to determine if badge present
    const pid = player?.id ?? player?.playerId ?? null;
    if (!pid) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/achievements/player?player_id=${encodeURIComponent(String(pid))}`);
        const j = await res.json();
        if (cancelled) return;
        const ach = (j.achievements || []);
        if (ach && ach.length > 0) {
          setHasBadge(true);
          setBadgeIcon(ach[0].icon_url ?? null);
        } else {
          setHasBadge(false);
          setBadgeIcon(null);
        }
      } catch (e) {
        if (!cancelled) { setHasBadge(false); setBadgeIcon(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [player?.id]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 180,
        background: '#F4F4F4',
        color: '#111',
        boxSizing: 'border-box',
        borderRadius: 8,
        overflow: 'hidden',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 14, fontWeight: 700, background: 'transparent', padding: 0, borderRadius: 0, boxShadow: 'none', zIndex: 5, color: '#111' }}>
        {Math.round(ratingNum * 100) / 100}
      </div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: mixWithWhite(rankColor, 0.7), border: `3px solid ${rankColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: '#8E8E8E' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1, paddingRight: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.first_name || ''}</div>
          { (player.last_name && String(player.last_name).trim() !== '') ? (
            <div style={{ fontSize: 10, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.last_name}</div>
          ) : null }
          <div style={{ fontSize: 9, color: '#606060' }}>{tierName}</div>

          <div style={{ marginTop: 6, width: '65%', maxWidth: 110, height: 6, borderRadius: 4, background: '#BDBAB8', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(levelProgressPct)}%`, height: '100%', background: rankColor }} />
          </div>
        </div>

        {/* rating moved to absolute top-right badge so tier/progress can span full width */}
      </div>

      {/* Skill cluster: 2-3-2 pentagon-like layout (top 2, middle 3, bottom 2) */}
      <div style={{ width: '100%', maxWidth: 160, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {skillLabels.slice(0,2).map((label, idx) => {
              const i = idx;
              const scoreRaw = skillScores[i] ?? 0;
              const score = Math.round(scoreRaw * 100) / 100;
              const heat = getSkillHeatStyle(label, scoreRaw);
              const bg = heat?.background ?? '#efefef';
              const fg = heat?.color ?? '#000';
              return (
                <div key={label} style={{ flex: '0 0 34%', maxWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '0 2%' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: fg, fontWeight: 700 }}>{score}</div>
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#000', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>{label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            {skillLabels.slice(2,5).map((label, idx) => {
              const i = 2 + idx;
              const scoreRaw = skillScores[i] ?? 0;
              const score = Math.round(scoreRaw * 100) / 100;
              const heat = getSkillHeatStyle(label, scoreRaw);
              const bg = heat?.background ?? '#efefef';
              const fg = heat?.color ?? '#000';
              return (
                <div key={label} style={{ flex: '0 0 30%', maxWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: fg, fontWeight: 700 }}>{score}</div>
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#000', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>{label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {skillLabels.slice(5,7).map((label, idx) => {
              const i = 5 + idx;
              const scoreRaw = skillScores[i] ?? 0;
              const score = Math.round(scoreRaw * 100) / 100;
              const heat = getSkillHeatStyle(label, scoreRaw);
              const bg = heat?.background ?? '#efefef';
              const fg = heat?.color ?? '#000';
              return (
                <div key={label} style={{ flex: '0 0 34%', maxWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '0 2%' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: fg, fontWeight: 700 }}>{score}</div>
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#000', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: sessions link + add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {!isAdmin && (
          <a href={`/sessions/breakdown?player_id=${encodeURIComponent(String(player?.id ?? player?.playerId ?? ''))}`} style={{ fontStyle: 'italic', fontSize: 11, color: '#000', textDecoration: 'none' }}>skill breakdown</a>
        )}

        {isAdmin && (
          <>
            <a href={`/sessions/breakdown?player_id=${encodeURIComponent(String(player?.id ?? player?.playerId ?? ''))}`} style={{ fontSize: 11, color: '#000', textDecoration: 'underline' }}>SESSIONS: {sessionsCount}</a>

            <div
              onClick={() => {
                if (typeof onAddStats === 'function') { onAddStats(player); return; }
                const pid = player?.id ?? player?.playerId ?? '';
                if (typeof window !== 'undefined') window.location.href = `/sessions/new?player_id=${encodeURIComponent(String(pid))}`;
              }}
              title="Add session"
              style={{ width: 34, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="#1E1E1E" />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
}