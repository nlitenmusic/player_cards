'use client';
import React, { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { getTierColor, getMacroTier, macroTiers, MICRO } from "../lib/tiers";
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

  return (
    <div
      style={{
        position: 'relative',
        width: 192,
        height: 236,
        background: '#F4F4F4',
        color: '#111',
        boxSizing: 'border-box',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Figma: MY CARD header (name, tier badge, rating, progress) */}
      <div className="card-header">
        {/* (removed duplicate tier badge and name; using Figma header) */}

        {/* header */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 192, height: 58.87, display: 'flex', alignItems: 'center', padding: 8, gap: 8 }}>
          <div style={{ width: 50, height: 49.87, borderRadius: 25, background: mixWithWhite(rankColor, 0.7), border: `3px solid ${rankColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: 43.87, height: 43.87, borderRadius: 22, background: '#8E8E8E', position: 'relative' }} />
            <div style={{ position: 'absolute', left: 16.21, top: 15.8, width: 16.98, height: 16.98 }}>
              {/* person icon placeholder */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z" fill="#fff"/></svg>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0px 4px', gap: 2, width: 134, height: 41 }}>
            <div style={{ fontSize: 10, lineHeight: '12px', color: '#000', fontWeight: 700 }}>{player.first_name || ''} {player.last_name || ''}</div>
            <div style={{ fontSize: 8, lineHeight: '10px', color: '#606060' }}>{tierName}</div>

            <div style={{ position: 'relative', width: 96, height: 5, borderRadius: 3, marginTop: 6 }}>
              <div style={{ position: 'absolute', width: '100%', height: 5, background: '#BDBAB8', borderRadius: 3 }} />
              <div style={{ position: 'absolute', width: `${Math.round(levelProgressPct)}%`, height: 5, background: rankColor, borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ marginLeft: 'auto', position: 'absolute', right: 6, top: 8, width: 27, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, lineHeight: '17px', textAlign: 'center', color: '#000' }}>{Math.round(ratingNum * 100) / 100}</div>
          </div>
        </div>
      </div>

      {/* Figma: Skill score circles cluster (absolute positioned bubbles) */}
      <div className="skill-cluster">
        <div style={{ position: 'absolute', left: 17, top: 65, width: 160, height: 132 }}>
          {skillLabels.map((label, i) => {
            const scoreRaw = skillScores[i] ?? 0;
            const score = Math.round(scoreRaw * 100) / 100;
            const positions: Record<string, any> = {
              Backhand: { left: 34, top: 0, bg: '#DED595' },
              Return: { left: 94, top: 0, bg: '#EEE49F' },
              Forehand: { left: 0, top: 46, bg: '#DED595' },
              Movement: { left: 60, top: 46, bg: '#B9EEC4' },
              Volley: { left: 120, top: 46, bg: '#FFF4AD' },
              Serve: { left: 34, top: 92, bg: '#F2E8A2' },
              Overhead: { left: 94, top: 92, bg: '#E5B791' },
            };
            const pos = positions[label] ?? { left: 0, top: 0, bg: '#efefef' };
            return (
              <div
                key={label}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: pos.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                  gap: 1,
                }}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 5, lineHeight: '6px', color: '#000', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: '19px', color: '#000' }}>{score}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* sessions and add button (admin-only) */}
      {isAdmin && (
        <>
          <div
            onClick={() => {
              if (typeof onEditPlayer === 'function') {
                onEditPlayer(player);
                return;
              }
              if (player?.id) {
                window.location.href = `/players/${player.id}/edit`;
              }
            }}
            style={{ position: 'absolute', left: 9, top: 218, fontSize: 8.08683, lineHeight: '10px', color: '#000', cursor: 'pointer', textDecoration: 'underline' }}
          >
            SESSIONS: {sessionsCount}
          </div>

          <div
            onClick={() => {
                  if (typeof onAddStats === 'function') {
                    onAddStats(player);
                    return;
                  }
                  const pid = player?.id ?? player?.playerId ?? '';
                  if (typeof window !== 'undefined') {
                    window.location.href = `/sessions/new?player_id=${encodeURIComponent(String(pid))}`;
                  }
            }}
            title="Add session"
            style={{ position: 'absolute', width: 30, height: 28, left: 160, top: 205, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', left: '20.83%', right: '20.83%', top: '20.83%', bottom: '20.83%', border: '1.6px solid #1E1E1E', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="#1E1E1E" />
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Badges removed from UI per request */}
    </div>
  );
}