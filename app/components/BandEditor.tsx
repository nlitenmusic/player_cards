"use client";

import React from 'react';
import referenceKey, { normalizeKey, getBand } from '../lib/referenceKey';

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
  const [openInfo, setOpenInfo] = React.useState<{ skill: string; component: string } | null>(null);
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
                <div key={ck} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, position: 'relative' }}>
                    <div style={{ minWidth: 120, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{componentLabels[ck]}</span>
                    <button aria-label={`Show band info for ${componentLabels[ck]} of ${s}`} onClick={() => setOpenInfo((o) => (o && o.skill === s && o.component === String(ck) ? null : { skill: s, component: String(ck) }))} style={{ background: 'transparent', border: 'none', padding: '4px 6px', borderRadius: 6, cursor: 'pointer', color: '#6b7280' }}>i</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', borderRadius: 6, border: '1px solid #ccc', overflow: 'hidden', background: heatStyle?.background }}>
                    <button className="stat-chev" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(s, ck, (val == null ? 0 : Number(val)) - 1)} style={{ padding: '0 8px', height: 36, background: 'transparent', border: 'none', cursor: 'pointer', color: heatStyle?.color }}>‹</button>
                    <input value={val ?? ''} onChange={(e) => { const v = e.target.value.trim(); const n = v === '' ? null : Number(v); onChange(s, ck, n); }} style={{ width: 84, padding: '6px 8px', border: 'none', background: 'transparent', outline: 'none', textAlign: 'center', color: heatStyle?.color }} />
                    <button className="stat-chev" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(s, ck, (val == null ? 0 : Number(val)) + 1)} style={{ padding: '0 8px', height: 36, background: 'transparent', border: 'none', cursor: 'pointer', color: heatStyle?.color }}>›</button>
                  </div>

                  {openInfo && openInfo.skill === s && openInfo.component === String(ck) && (
                    <div role="dialog" aria-label="Band info" style={{ position: 'absolute', top: 44, left: 140, zIndex: 40, width: 320, padding: 10, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(2,6,23,0.08)', borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{s} — {componentLabels[ck]}</div>
                      {(() => {
                        const numeric = val == null ? null : Number(val);
                        if (numeric != null && !Number.isNaN(numeric)) {
                          const bb = getBand(s, String(ck), numeric);
                          return (
                            <div>
                              <div style={{ fontWeight: 700 }}>{bb.name}</div>
                              <div style={{ marginTop: 6, color: '#374151' }}>{bb.description}</div>
                            </div>
                          );
                        }
                        // otherwise show canonical band list
                        const sk = normalizeKey(s);
                        const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
                        const compMap: Record<string, string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
                        const canonical = (skillEntry && (skillEntry[String(ck)] || skillEntry[compMap[String(ck)]])) || null;
                        if (Array.isArray(canonical)) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {canonical.map((b: any, i: number) => (
                                <div key={i} style={{ display: 'flex', gap: 8 }}>
                                  <div style={{ minWidth: 64, fontWeight: 700 }}>{b.name}</div>
                                  <div style={{ color: '#374151' }}>{b.min}–{b.max}: {b.description}</div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return <div style={{ color: '#374151' }}>No band reference available.</div>;
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
