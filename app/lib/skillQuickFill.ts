export type QuickFillResult = { c?: number | null; p?: number | null; a?: number | null; s?: number | null; t?: number | null };

// Map of human labels to target scalars for the Functional band
// Expanded band options covering the full spectrum (Unstable -> Tour Reference).
// Generate Low / Mid / High options for each canonical band range.
const BAND_DEFINITIONS = [
  { name: 'Unstable', min: 0, max: 6, desc: 'Cannot consistently execute; frequent errors' },
  { name: 'Conditional', min: 7, max: 12, desc: 'Performs in controlled settings; degrades under pressure' },
  { name: 'Functional', min: 13, max: 18, desc: 'Sustains rallies vs peers with predictable miss patterns' },
  { name: 'Competitive', min: 19, max: 24, desc: 'Performance that holds up under match pressure' },
  { name: 'Advanced / Pro-Track', min: 25, max: 30, desc: 'Advanced performance approaching professional levels' },
  { name: 'Tour Reference', min: 31, max: 100, desc: 'Elite / tour-level reference behavior' },
];

function makeTargets(min: number, max: number) {
  // low = 25% point, mid = 50% point, high = 75% point within the band's range
  const low = Math.round(min + (max - min) * 0.25);
  const mid = Math.round((min + max) / 2);
  const high = Math.round(min + (max - min) * 0.75);
  return { low, mid, high };
}

export const BAND_OPTIONS = BAND_DEFINITIONS.flatMap((b) => {
  const { low, mid, high } = makeTargets(b.min, b.max);
  return [
    { label: `${b.name} — Low (${low})`, target: low, desc: b.desc },
    { label: `${b.name} — Mid (${mid})`, target: mid, desc: b.desc },
    { label: `${b.name} — High (${high})`, target: high, desc: b.desc },
  ];
});

// Simple quick-fill: equal-distribution baseline. Movement rows are authoritative on `t` only.
// This function returns an object with new component values to apply to a row.
export function quickFillForTarget(targetScalar: number, skillType: string) {
  const key = String(skillType ?? '').trim().toLowerCase();
  if (key === 'movement') {
    return { t: targetScalar } as QuickFillResult;
  }

  // Equal-distribution baseline: set all components to targetScalar.
  return { c: targetScalar, p: targetScalar, a: targetScalar, s: targetScalar, t: targetScalar } as QuickFillResult;
}

export default quickFillForTarget;
