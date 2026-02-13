"use client";
import React, { useRef, useState } from "react";
import referenceKey, { normalizeKey, getBand } from "../lib/referenceKey";

interface Props {
  skill: string;
  values: Array<{ date?: string; value: number }>;
  metric: string;
  width?: number;
  height?: number;
}

export default function SkillHistoryChart({ skill, values, metric, width = 720, height = 220 }: Props) {
  const key = normalizeKey(skill);
  const skillEntry = (referenceKey as any)[key] || (referenceKey as any)[key.replace(/\s+/g, '')] || {};
  const compMap: Record<string,string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
  const metricName = metric === 'overall' ? 'overall' : (compMap[metric] || metric);
  const bands = skillEntry[metricName] || [];

  // compute data range
  const valuesOnly = values.map(v => Number.isFinite(v.value) ? v.value : 0);
  const dataMin = valuesOnly.length ? Math.min(...valuesOnly) : 0;
  const dataMax = valuesOnly.length ? Math.max(...valuesOnly) : 0;

  // determine y domain using bands when available
  let yMin: number;
  let yMax: number;
  if (bands.length) {
    const vLow = Math.floor(Math.max(0, dataMin));
    const vHigh = Math.floor(Math.max(0, dataMax));
    let idxLow = bands.findIndex((b:any) => vLow >= b.min && vLow <= b.max);
    let idxHigh = bands.findIndex((b:any) => vHigh >= b.min && vHigh <= b.max);
    if (idxLow === -1) {
      idxLow = bands.findIndex((b:any) => b.min > vLow);
      if (idxLow === -1) idxLow = bands.length - 1;
      else idxLow = Math.max(0, idxLow - 1);
    }
    if (idxHigh === -1) {
      idxHigh = bands.findIndex((b:any) => b.max >= vHigh);
      if (idxHigh === -1) idxHigh = bands.length - 1;
    }
    if (idxLow > idxHigh) { const tmp = idxLow; idxLow = idxHigh; idxHigh = tmp; }
    idxLow = Math.max(0, idxLow - 1);
    idxHigh = Math.min(bands.length - 1, idxHigh + 1);
    yMin = bands[idxLow].min;
    yMax = bands[idxHigh].max;
  } else {
    const pad = Math.max(1, Math.round((dataMax - dataMin) * 0.12));
    yMin = Math.floor(Math.max(0, dataMin - pad));
    yMax = Math.ceil(dataMax + pad || 30);
  }

  const pad = { left: 64, right: 12, top: 8, bottom: 36 };
  const innerW = Math.max(64, width - pad.left - pad.right);
  const innerH = Math.max(32, height - pad.top - pad.bottom);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const bandColor = (bandIdx: number, total: number) => {
    if (total <= 1 || bandIdx < 0) return '#666';
    const t = bandIdx / Math.max(1, total - 1);
    const r = Math.round(220 * (1 - t) + 16 * t);
    const g = Math.round(38 * (1 - t) + 185 * t);
    const b = Math.round(38 * (1 - t) + 129 * t);
    return `rgb(${r},${g},${b})`;
  };

  // points
  const points = values.map((v, i) => {
    const x = pad.left + (i / Math.max(1, values.length - 1)) * innerW;
    const norm = (v.value - yMin) / Math.max(1e-6, (yMax - yMin));
    const y = pad.top + (1 - Math.max(0, Math.min(1, norm))) * innerH;
    return { x, y, v };
  });
  const d = points.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');

  // y ticks
  const span = Math.max(1, yMax - yMin);
  const step = Math.max(1, Math.ceil(span / 5));
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += step) ticks.push(v);
  if (ticks[ticks.length-1] !== yMax) ticks.push(yMax);

  return (
    <div ref={containerRef} style={{ width, overflow: 'auto', position: 'relative' }}>
      <svg width={width} height={height} aria-label={`History for ${skill} ${metricName}`}>
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>

        {/* faint band grid lines */}
        {bands.length ? bands.map((b:any, i:number) => {
          const mid = (b.min + b.max) / 2;
          const norm = (mid - yMin) / Math.max(1e-6, (yMax - yMin));
          const yPos = pad.top + (1 - Math.max(0, Math.min(1, norm))) * innerH;
          return <line key={i} x1={pad.left} x2={pad.left+innerW} y1={yPos} y2={yPos} stroke={'rgba(0,0,0,0.06)'} strokeWidth={1} />;
        }) : null}

        {/* y ticks */}
        {ticks.map((tv, i) => {
          const norm = (tv - yMin) / Math.max(1e-6, (yMax - yMin));
          const yPos = pad.top + (1 - Math.max(0, Math.min(1, norm))) * innerH;
          return (
            <g key={`tick-${i}`}>
              <line x1={pad.left-6} x2={pad.left} y1={yPos} y2={yPos} stroke={'rgba(0,0,0,0.12)'} strokeWidth={1} />
              <text x={pad.left-10} y={yPos+4} fontSize={11} fill="#333" textAnchor="end">{tv}</text>
            </g>
          );
        })}

        {/* axes */}
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={pad.top+innerH} stroke={'rgba(0,0,0,0.08)'} />
        <line x1={pad.left} x2={pad.left+innerW} y1={pad.top+innerH} y2={pad.top+innerH} stroke={'rgba(0,0,0,0.08)'} />

        {/* x labels */}
        {values.map((v, i) => {
          const x = pad.left + (i / Math.max(1, values.length - 1)) * innerW;
          const label = v.date ? (new Date(v.date)).toLocaleDateString() : `#${i+1}`;
          return <text key={i} x={x} y={pad.top+innerH+14} fontSize={10} textAnchor="middle" fill="#444">{label}</text>;
        })}

        {/* line */}
        <path d={d} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* points with hover handlers: show numeric value above node and band name colored to the right */}
        {points.map((p, i) => {
          const band = getBand(skill, metricName, p.v.value || 0);
          const bandIdx = bands.length ? bands.findIndex((b:any) => (p.v.value || 0) >= b.min && (p.v.value || 0) <= b.max) : -1;
          const bandLabel = (bands[bandIdx] && bands[bandIdx].name) || band.name || '';
          const color = bandColor(bandIdx, bands.length);
          const displayValue = Math.round((p.v.value ?? 0) * 10) / 10;
          const isHovered = hoveredIndex === i;
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle cx={p.x} cy={p.y} r={4} fill={i===points.length-1 ? '#111' : '#fff'} stroke="#111" strokeWidth={1} />
              <title>{`${displayValue} — ${bandLabel}`}</title>

              {/* numeric value above node when hovered */}
              {isHovered ? (
                <text x={p.x} y={p.y - 10} fontSize={11} fontWeight={600} textAnchor="middle" fill="#111">{displayValue}</text>
              ) : null}

              {/* band name to the right of the node in heat color when hovered */}
              {isHovered ? (
                <text x={p.x + 10} y={p.y - 2} fontSize={11} textAnchor="start" fill={color}>{bandLabel}</text>
              ) : null}
            </g>
          );
        })}

      </svg>

      {/* tooltip overlay removed — hover handled via SVG elements */}
    </div>
  );
}
