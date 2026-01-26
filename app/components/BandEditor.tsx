"use client";

import React from 'react';
import referenceKey, { normalizeKey } from '../lib/referenceKey';

type ComponentKey = 'c' | 'p' | 'a' | 's' | 't';

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

export default function BandEditor({ skills, valuesMap, onChange }: { skills: string[]; valuesMap?: Record<string, Record<ComponentKey, number | null>>; onChange: (skill: string, component: ComponentKey, val: number | null) => void }) {
  const componentKeys: ComponentKey[] = ['c','p','a','s','t'];
  const componentLabels: Record<ComponentKey, string> = { c: 'Consistency', p: 'Power', a: 'Accuracy', s: 'Spin', t: 'Technique' };

  return (
    <div>
      {skills.map((s) => {
        const keyNorm = (s||'').toString().trim().toLowerCase();
        const isMovement = keyNorm === 'movement';
        const row = valuesMap?.[s] ?? ({} as Record<ComponentKey, number | null>);
        return (
          <div key={s} style={{ borderTop: '1px solid #f1f1f1', paddingTop: 8, marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{s}</div>
            {componentKeys.map((ck) => {
              if (isMovement && ck !== 't') return null;
              const val = row[ck] ?? null;
              const heatStyle = getComponentHeatStyle(s, String(ck), val);
              return (
                <div key={ck} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ minWidth: 120 }}>{componentLabels[ck]}</div>
                  <div style={{ display: 'flex', alignItems: 'center', borderRadius: 6, border: '1px solid #ccc', overflow: 'hidden', background: heatStyle?.background }}>
                    <button className="stat-chev" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(s, ck, (val == null ? 0 : Number(val)) - 1)} style={{ padding: '0 8px', height: 36, background: 'transparent', border: 'none', cursor: 'pointer', color: heatStyle?.color }}>‹</button>
                    <input value={val ?? ''} onChange={(e) => { const v = e.target.value.trim(); const n = v === '' ? null : Number(v); onChange(s, ck, n); }} style={{ width: 84, padding: '6px 8px', border: 'none', background: 'transparent', outline: 'none', textAlign: 'center', color: heatStyle?.color }} />
                    <button className="stat-chev" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(s, ck, (val == null ? 0 : Number(val)) + 1)} style={{ padding: '0 8px', height: 36, background: 'transparent', border: 'none', cursor: 'pointer', color: heatStyle?.color }}>›</button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
