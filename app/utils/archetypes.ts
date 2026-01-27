type ComponentKey = 'c' | 'p' | 'a' | 's' | 't';

export type Archetype = {
  name: string;
  template: Partial<Record<ComponentKey, number | null>>;
};

// simple k-means clustering for numeric component vectors (no external deps)
function kmeans(vectors: number[][], k = 3, iterations = 10) {
  if (!vectors.length) return [] as number[][];
  const dim = vectors[0].length;
  // init centroids by sampling first k vectors (or repeating last)
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) centroids.push(vectors[i % vectors.length].slice());

  const assign = new Array(vectors.length).fill(0);

  for (let it = 0; it < iterations; it++) {
    // assign
    for (let i = 0; i < vectors.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let j = 0; j < centroids.length; j++) {
        let d = 0;
        for (let m = 0; m < dim; m++) {
          const diff = (vectors[i][m] ?? 0) - (centroids[j][m] ?? 0);
          d += diff * diff;
        }
        if (d < bestDist) { bestDist = d; best = j; }
      }
      assign[i] = best;
    }

    // recompute
    const sums: number[][] = Array.from({ length: centroids.length }, () => Array(dim).fill(0));
    const counts = Array(centroids.length).fill(0);
    for (let i = 0; i < vectors.length; i++) {
      const c = assign[i];
      counts[c]++;
      for (let m = 0; m < dim; m++) sums[c][m] += (vectors[i][m] ?? 0);
    }
    for (let j = 0; j < centroids.length; j++) {
      if (counts[j] === 0) continue;
      for (let m = 0; m < dim; m++) centroids[j][m] = sums[j][m] / counts[j];
    }
  }

  return centroids;
}

export function generateArchetypesFromSessions(sessions: any[], skillLabels: string[], componentKeys: ComponentKey[], k = 3) {
  // sessions: array of session objects that contain session_stats: [{ skill_type, c,p,a,s,t }]
  const archetypesBySkill: Record<string, Archetype[]> = {};

  const normSkill = (s: string) => String(s || '').trim().toLowerCase();

  for (const skill of skillLabels) {
    const key = normSkill(skill);
    const vectors: number[][] = [];
    for (const sess of sessions || []) {
      for (const r of (sess.session_stats || [])) {
        if (normSkill(r.skill_type) !== key) continue;
        const vec: number[] = componentKeys.map((ck) => {
          // movement only uses t; others use all components — but keep a simple approach
          const v = r[ck];
          return (v == null || v === '') ? 0 : Number(v);
        });
        vectors.push(vec);
      }
    }

    if (!vectors.length) {
      archetypesBySkill[skill] = [];
      continue;
    }

    const centroids = kmeans(vectors, Math.min(k, Math.max(1, Math.floor(vectors.length / 2) || 1)));
    const atypes: Archetype[] = centroids.map((c, i) => {
      const tpl: Partial<Record<ComponentKey, number | null>> = {};
      for (let idx = 0; idx < componentKeys.length; idx++) tpl[componentKeys[idx]] = Math.round(c[idx]);
      return { name: `Archetype ${i + 1}`, template: tpl };
    });

    archetypesBySkill[skill] = atypes;
  }

  return archetypesBySkill;
}

export function applyArchetypeToRows(rows: any[], skillLabel: string, archetype: Archetype) {
  return rows.map((r) => {
    if (String(r.skill_type) !== skillLabel) return r;
    const out = { ...r };
    for (const k of Object.keys(archetype.template) as ComponentKey[]) out[k] = archetype.template[k] ?? out[k];
    return out;
  });
}

// Built-in human-friendly archetype presets (numeric templates)
const VH = 36; // very high
const H = 30;  // high
const M = 18;  // medium
const L = 6;   // low

export const BUILT_IN_ARCHETYPES: Record<string, Archetype[]> = {
  Serve: [
    { name: 'Bombarder', template: { c: L, p: VH, a: M, s: L, t: M } },
    { name: 'Precision Ace', template: { c: M, p: M, a: VH, s: L, t: H } },
    { name: 'Spin Surgeon', template: { c: M, p: M, a: H, s: VH, t: M } },
    { name: 'Tactical Opener', template: { c: H, p: L, a: H, s: M, t: M } },
    { name: 'Serve-and-Volley Trigger', template: { c: M, p: M, a: H, s: L, t: H } },
  ],
  Return: [
    { name: 'Neutralizer', template: { c: VH, p: L, a: VH, s: L, t: M } },
    { name: 'Counterpuncher', template: { c: M, p: H, a: H, s: L, t: M } },
    { name: 'Aggressive Charger', template: { c: L, p: VH, a: M, s: L, t: H } },
    { name: 'Spin Ridder', template: { c: M, p: M, a: M, s: VH, t: H } },
    { name: 'Chip-and-Chase', template: { c: H, p: L, a: M, s: L, t: M } },
  ],
  Forehand: [
    { name: 'Baseline Bomber', template: { c: M, p: VH, a: M, s: L, t: M } },
    { name: 'Topspin Maestro', template: { c: M, p: M, a: H, s: VH, t: H } },
    { name: 'All-court Finisher', template: { c: H, p: H, a: H, s: M, t: H } },
    { name: 'Precision Feeder', template: { c: H, p: L, a: VH, s: L, t: H } },
    { name: 'Counterpunch Forehand', template: { c: H, p: M, a: H, s: M, t: M } },
  ],
  Backhand: [
    { name: 'Flat Backliner', template: { c: M, p: H, a: M, s: L, t: M } },
    { name: 'Spin Backhand', template: { c: M, p: L, a: M, s: H, t: H } },
    { name: 'Two-Handed Crusher', template: { c: M, p: VH, a: H, s: L, t: M } },
    { name: 'Touch Backhand', template: { c: H, p: L, a: H, s: L, t: H } },
    { name: 'All-Court Stabilizer', template: { c: H, p: L, a: M, s: L, t: M } },
  ],
  Volley: [
    { name: 'Net Finisher', template: { c: H, p: M, a: H, s: L, t: H } },
    { name: 'Touch Artist', template: { c: M, p: L, a: H, s: L, t: VH } },
    { name: 'Puncher', template: { c: M, p: H, a: M, s: L, t: H } },
    { name: 'Approach Complement', template: { c: H, p: L, a: M, s: L, t: M } },
    { name: 'Jam & Angle', template: { c: M, p: L, a: H, s: L, t: H } },
  ],
  Overhead: [
    { name: 'Smash Finisher', template: { c: M, p: VH, a: H, s: L, t: M } },
    { name: 'Placement Overhead', template: { c: M, p: M, a: H, s: L, t: H } },
    { name: 'Pop-up Overhead', template: { c: H, p: L, a: M, s: L, t: M } },
    { name: 'Spin Smash', template: { c: M, p: M, a: M, s: H, t: H } },
    { name: 'Safe Cleaner', template: { c: H, p: L, a: M, s: L, t: M } },
  ],
};

export function getBuiltInArchetypes() { return BUILT_IN_ARCHETYPES; }

// Scale an archetype template so its largest component equals `topValue`.
export function scaleArchetypeTemplate(archetype: Archetype, topValue: number, skillLabel?: string) {
  if (!archetype || typeof topValue !== 'number' || Number.isNaN(topValue)) return archetype;
  // find the max numeric value in the template
  let maxVal = 0;
  for (const k of Object.keys(archetype.template) as ComponentKey[]) {
    const v = archetype.template[k];
    if (typeof v === 'number' && !Number.isNaN(v)) maxVal = Math.max(maxVal, Math.abs(v));
  }
  if (maxVal <= 0) return archetype;
  const factor = topValue / maxVal;
  const scaled: Partial<Record<ComponentKey, number | null>> = {};
  for (const k of Object.keys(archetype.template) as ComponentKey[]) {
    const v = archetype.template[k];
    if (v == null || Number.isNaN(Number(v))) scaled[k] = null;
    else scaled[k] = Math.round(Number(v) * factor);
  }
  return { name: archetype.name, template: scaled } as Archetype;
}

// Scale an archetype template so that the average of relevant components equals `overallTarget`.
export function scaleArchetypeToMatchOverall(archetype: Archetype, overallTarget: number, skillLabel?: string) {
  if (!archetype || typeof overallTarget !== 'number' || Number.isNaN(overallTarget)) return archetype;
  // Determine which components to consider: movement uses only 't', otherwise use all five
  const isMovement = typeof skillLabel === 'string' && String(skillLabel).trim().toLowerCase() === 'movement';
  const keys: ComponentKey[] = isMovement ? ['t'] : ['c','p','a','s','t'];

  const vals: number[] = [];
  for (const k of keys) {
    const v = archetype.template[k];
    if (typeof v === 'number' && !Number.isNaN(v)) vals.push(Number(v));
  }
  if (!vals.length) return archetype;
  const currentAvg = vals.reduce((a,b) => a + b, 0) / vals.length;
  if (currentAvg <= 0) {
    // fallback to largest-component scaling
    return scaleArchetypeTemplate(archetype, overallTarget, skillLabel);
  }
  const factor = overallTarget / currentAvg;
  const scaled: Partial<Record<ComponentKey, number | null>> = {};
  for (const k of Object.keys(archetype.template) as ComponentKey[]) {
    const v = archetype.template[k];
    if (v == null || Number.isNaN(Number(v))) scaled[k] = null;
    else scaled[k] = Math.round(Number(v) * factor);
  }
  return { name: archetype.name, template: scaled } as Archetype;
}

// Scale archetype so its average equals overallTarget, but constrain components
// to be within +/- pct (default 0.3) of overallTarget. Attempts iterative
// adjustment with clamping to respect both average and bounds.
export function scaleArchetypeToOverallWithBounds(archetype: Archetype, overallTarget: number, skillLabel?: string, pct = 0.3) {
  if (!archetype || typeof overallTarget !== 'number' || Number.isNaN(overallTarget)) return archetype;
  const isMovement = typeof skillLabel === 'string' && String(skillLabel).trim().toLowerCase() === 'movement';
  const keys: ComponentKey[] = isMovement ? ['t'] : ['c','p','a','s','t'];
  const lower = Math.max(0, overallTarget * (1 - pct));
  const upper = overallTarget * (1 + pct);

  // start with mean scaling
  let cur = scaleArchetypeToMatchOverall(archetype, overallTarget, skillLabel).template;

  // convert to numeric array for keys
  const getVals = () => keys.map(k => (typeof cur[k] === 'number' ? Number(cur[k]) : 0));

  for (let iter = 0; iter < 8; iter++) {
    // clamp
    for (const k of keys) {
      const v = typeof cur[k] === 'number' ? Number(cur[k]) : 0;
      if (v < lower) cur[k] = Math.round(lower);
      else if (v > upper) cur[k] = Math.round(upper);
      else cur[k] = Math.round(v);
    }

    const vals = getVals();
    const avg = vals.reduce((a,b) => a + b, 0) / vals.length;
    // if average close enough, stop
    if (Math.abs(avg - overallTarget) <= 1) break;
    // scale towards overallTarget
    const factor = overallTarget / (avg || 1);
    for (const k of keys) {
      const v = typeof cur[k] === 'number' ? Number(cur[k]) : 0;
      cur[k] = Math.round(Math.max(0, Math.min(upper, v * factor)));
    }
  }

  const scaled: Partial<Record<ComponentKey, number | null>> = {};
  for (const k of ['c','p','a','s','t'] as ComponentKey[]) scaled[k] = cur[k] ?? null;
  return { name: archetype.name, template: scaled } as Archetype;
}
