"use client";
import React, { useMemo } from "react";
import BandTooltip from "./Leaderboards/BandTooltip";
import referenceKey, { normalizeKey } from "../lib/referenceKey";

export default function SkillBreakdown({ stats, player, sessionDate }: { stats: any[]; player?: any; sessionDate?: string | null }) {
  const skillLabels = ["Serve", "Return", "Forehand", "Backhand", "Volley", "Overhead", "Movement"];

  const rows = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of stats || []) {
      const key = String(r.skill_type || "").trim().toLowerCase();
      map[key] = r;
    }
    return skillLabels.map((label) => {
      const k = label.toLowerCase();
      const r = map[k] || {};
      return {
        skill_type: label,
        c: r.c ?? null,
        p: r.p ?? null,
        a: r.a ?? null,
        s: r.s ?? null,
        t: r.t ?? null,
      };
    });
  }, [stats]);

  const BAND_BASE_HUES = [0, 28, 52, 140, 200, 235, 270];
  const BAND_BASE_LIGHTNESS = [78, 74, 60, 72, 78, 74, 84];

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
    if (bandIdx === -1) {
      // value falls in a gap (e.g. 6.5 between 6 and 7) — map to the next band's index
      const nextIdx = bands.findIndex((b: any) => v < b.min);
      if (nextIdx !== -1) {
        bandIdx = nextIdx;
      } else {
        bandIdx = bands.length - 1;
      }
    }
    const band = bands[bandIdx];
    const span = Math.max(1, (band.max - band.min));
    const clampedV = Math.max(band.min, Math.min(band.max, v));
    const frac = Math.max(0, Math.min(1, (clampedV - band.min) / span));
    return computeBandColor(bandIdx, frac);
  }

  return (
    <div className="skill-breakdown" style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
      <div className="skill-breakdown__panel" style={{ width: 820, maxWidth: '100%', background: '#fff', padding: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{(player?.first_name || '') + (player?.last_name ? ` ${player.last_name}` : '')}</div>
            {sessionDate && <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Session date: {String(sessionDate).slice(0,10)}</div>}
          </div>

          {/* Color key / legend for band meanings */}
          <div className="skill-breakdown__legend" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Unstable','Conditional','Functional','Competitive','Advanced / Pro-Track','Tour Challenger','Tour Elite'].map((name, idx) => {
              const { background, color } = computeBandColor(idx, 0.6);
              return (
                <div key={name} className="skill-breakdown__legend-item" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                  <div className="skill-breakdown__legend-swatch" style={{ width: 14, height: 14, borderRadius: 4, background, border: '1px solid rgba(0,0,0,0.06)' }} />
                  <div className="skill-breakdown__legend-name" style={{ whiteSpace: 'nowrap' }}>{name}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {rows.map((r) => (
            <div key={r.skill_type} className="skill-breakdown__card" style={{ borderRadius: 10, padding: 12, background: '#F8FAFC', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>{r.skill_type}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
                {(['c','p','a','s','t'] as const).map((ck) => {
                  const isMovement = normalizeKey(r.skill_type) === 'movement';
                  if (isMovement && ['c','p','a','s'].includes(ck)) return null;
                  const value = (r as any)[ck];
                  const heat = getComponentHeatStyle(r.skill_type, ck, value);
                  return (
                    <div key={ck} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', maxWidth: 220 }}>
                      <div className="skill-breakdown__label" style={{ color: '#374151', width: 110, textAlign: 'left' }}>{(ck === 'c' && 'Consistency') || (ck === 'p' && 'Power') || (ck === 'a' && 'Accuracy') || (ck === 's' && 'Spin') || (ck === 't' && 'Technique')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BandTooltip value={value ?? ''} skill={r.skill_type} component={ck}>
                          <div style={{ height: 36, minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: heat?.background ?? '#fff', color: heat?.color ?? '#111', border: '1px solid rgba(0,0,0,0.06)', fontWeight: 700 }}>{value ?? ''}</div>
                        </BandTooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (prefers-color-scheme: dark) {
          .skill-breakdown__panel { background: #07101a !important; color: #fff !important; }
          .skill-breakdown__legend-item, .skill-breakdown__legend-name { color: #fff !important; }
          .skill-breakdown__legend-swatch { border: 1px solid rgba(255,255,255,0.06) !important; }
          .skill-breakdown__card { background: #07111a !important; color: #fff !important; }
          .skill-breakdown__label { color: #fff !important; }
          /* target the small value tiles inside cards */
          .skill-breakdown__card div[style*="height: 36"] { border: 1px solid rgba(255,255,255,0.06) !important; color: #fff !important; }
        }
      `}</style>
    </div>
  );
}
