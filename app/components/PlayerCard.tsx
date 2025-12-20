'use client';
import React from "react";
import ProgressBar from "./ProgressBar";
import { getTierColor, getMacroTier, macroTiers, MICRO } from "../lib/tiers";

interface PlayerCardProps {
  player: any;
  isAdmin?: boolean;
  isTop?: boolean;
  maxStats?: Record<string, number>;
  onAddStats?: (player:any)=>void;
  onEditPlayer?: (player:any)=>void;
}

export default function PlayerCard({
  player,
  isAdmin = false,
  isTop = false,
  maxStats,
  onAddStats,
  onEditPlayer,
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

  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${rankColor}33`,
        borderRadius: 8,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        background: cardBg,
        color: "#111",
        minWidth: 220,
        maxWidth: 320,
        boxSizing: "border-box",
      }}
    >
      {/* tier badge top-right */}
      <div style={{ position: "absolute", top: 12, right: 12 }}>
        <div
          style={{
            background: rankColor,
            color: rankColor === "#FFD700" ? "#111" : "#fff",
            fontSize: 13,
            fontWeight: 700,
            padding: "4px 8px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {tierName}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05, fontWeight: 700, fontSize: 16 }}>
          <span>{player.first_name || ""}</span>
          <span>{player.last_name || ""}</span>
        </div>

        {isAdmin && (
          <div style={{ marginLeft: "auto" }} className="admin-controls">
            <button onClick={() => { console.log('onAddStats click', player?.id); onAddStats?.(player); }} style={{ marginRight: 8, fontSize: 12 }}>
              + Stats
            </button>
            <button onClick={() => onEditPlayer?.(player)} style={{ fontSize: 12 }}>
              Edit
            </button>
          </div>
        )}
      </div>

      <div style={{ color: "#374151", marginBottom: 8 }}>Sessions: {sessionsCount}</div>

      <div style={{ fontSize: 20, fontWeight: 600 }}>{Math.round(ratingNum * 100) / 100}</div>

      <div style={{ marginTop: 8 }}>
        <ProgressBar value={levelProgressPct} color={rankColor} label={`Progress to ${nextMacro.name} at level ${nextTierLevel}`} />
      </div>

      {skillScores.some((s) => s !== 0) && (
        <div style={{ marginTop: 10 }}>
          <strong style={{ fontSize: 12, color: "#374151" }}>Skill Scores:</strong>
          <ul style={{ margin: "6px 0 0 0", padding: 0, fontSize: 12 }}>
            {skillScores.map((s, i) => {
                const skillName = skillLabels[i] ?? `Row ${i + 1}`;
                const top = isTopStat(skillName, s);
                return (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 0 }}>
                        <div style={{ width: 22, display: 'flex', justifyContent: 'center' }}>
                          {(() => {
                            const dir = directionMap[skillName.toLowerCase()];
                            if (dir === 1) {
                              return (
                                <span title={`${skillName} ↑`} style={{ display: 'inline-flex', alignItems: 'center', color: '#16a34a' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M12 4l6 8h-4v8h-4v-8H6l6-8z" fill="#16a34a" />
                                  </svg>
                                </span>
                              );
                            }
                            if (dir === -1) {
                              return (
                                <span title={`${skillName} ↓`} style={{ display: 'inline-flex', alignItems: 'center', color: '#dc2626' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M12 20l-6-8h4V4h4v8h4l-6 8z" fill="#dc2626" />
                                  </svg>
                                </span>
                              );
                            }
                            return <span style={{ width: 14, height: 14, display: 'inline-block' }} />;
                          })()}
                        </div>

                        <span style={{ flex: 1, paddingLeft: 4 }}>{skillName}: {Math.round(s * 100) / 100}</span>

                        {top && (
                          <span title={`Top ${skillName}`} style={{ display: "inline-flex", alignItems: "center" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M12 2l2.6 5.26L20 9l-4 3.9L17.2 20 12 16.9 6.8 20 8 12.9 4 9l5.4-1.74L12 2z" fill="#FFD700" />
                            </svg>
                          </span>
                        )}
                  </li>
                );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}