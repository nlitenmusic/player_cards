export const MICRO = 3;

export const macroTiers = [
  { name: "Explorer", min: 0 },
  { name: "Rally Starter", min: 3 },
  { name: "Emerging Player", min: 6 },
  { name: "Developing Player", min: 9 },
  { name: "Match Player", min: 12 },
  { name: "Growth Player", min: 15 },
  { name: "Competitor", min: 18 },
  { name: "Advanced Competitor", min: 21 },
  { name: "Performance Player", min: 24 },
  { name: "Elite Performer", min: 27 },
  { name: "College Performance", min: 30 },
  { name: "Professional Track", min: 33 },
];

// Removed discrete tierColorMap: tiers now derive color from a continuous
// heatmap so the same color mapping used for band-standardization applies
// across the UI. Use `getTierColor` to obtain the hex color for a tier
// name or numeric rating.

// Shared band base hues/lightness used across the UI for skill heat swatches
export const BAND_BASE_HUES = [0, 28, 52, 140, 200, 270];
export const BAND_BASE_LIGHTNESS = [78, 74, 60, 72, 78, 84];

export function computeBandColor(bandIdx: number, frac = 0.5) {
  const hue = BAND_BASE_HUES[bandIdx] ?? 200;
  const baseL = BAND_BASE_LIGHTNESS[bandIdx] ?? 72;
  const darken = Math.round(Math.min(22, frac * 22));
  const lightness = Math.max(12, Math.min(92, baseL - darken));
  const saturation = 72;
  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const color = lightness > 56 ? '#111' : '#fff';
  const chipBg = 'rgba(255,255,255,0.96)';
  const chipBorder = `hsla(${hue}, ${saturation}%, ${Math.max(12, lightness)}%, 0.36)`;
  const chipShadow = `0 6px 14px hsla(${hue}, ${saturation}%, ${Math.max(12, lightness)}%, 0.14)`;
  return { background, color, chipBg, chipBorder, chipShadow };
}

export function getMacroTier(rating: number) {
  for (let i = macroTiers.length - 1; i >= 0; i--) {
    if (rating >= macroTiers[i].min) return { ...macroTiers[i], index: i };
  }
  return { ...macroTiers[0], index: 0 };
}

export function getTierColor(tierOrRating: string | number) {
  function clamp(v: number, a = 0, b = 1) {
    return Math.max(a, Math.min(b, v));
  }

  function hslToHex(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hh = h / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (0 <= hh && hh < 1) { r1 = c; g1 = x; b1 = 0; }
    else if (1 <= hh && hh < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (2 <= hh && hh < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (3 <= hh && hh < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (4 <= hh && hh < 5) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    const m = l - c / 2;
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function ratingToHeatHex(value: number) {
    const last = macroTiers[macroTiers.length - 1]?.min ?? 36;
    const maxVal = last + MICRO;
    const t = clamp((Number(value) - 0) / Math.max(1, maxVal - 0));
    // Interpolate hue from red (~6) to orange (~32) so mid values stay warm
    const startHue = 6;
    const endHue = 32;
    const hue = startHue + (endHue - startHue) * t;
    const sat = 84;
    const light = Math.round(28 + 32 * t); // 28% -> ~60%
    return hslToHex(Math.round(hue), sat, light);
  }

  // Prefer band-based colors for CSR so overall matches per-skill chip colors.
  function ratingToBandHex(value: number) {
    try {
      const v = Number(value);
      if (Number.isNaN(v)) throw new Error('invalid');
      // canonical band ranges used in skill definitions
      const BAND_RANGES: Array<{ min: number; max: number }> = [
        { min: 0, max: 6 },
        { min: 7, max: 12 },
        { min: 13, max: 18 },
        { min: 19, max: 24 },
        { min: 25, max: 30 },
        { min: 31, max: 100 },
      ];
      const lookup = Math.floor(v);
      let bandIdx = BAND_RANGES.findIndex((b) => lookup >= b.min && lookup <= b.max);
      if (bandIdx === -1) bandIdx = lookup < BAND_RANGES[0].min ? 0 : BAND_RANGES.length - 1;
      const band = BAND_RANGES[bandIdx];
      const span = Math.max(1, band.max - band.min);
      const frac = Math.max(0, Math.min(1, (v - band.min) / span));
      const cb = computeBandColor(bandIdx, frac);
      const m = String(cb.background).match(/hsl\(([-0-9.]+),\s*([-0-9.]+)%[,\s]+([-0-9.]+)%\)/i);
      if (m) {
        const hh = Number(m[1]) || 0;
        const ss = Number(m[2]) || 72;
        const ll = Number(m[3]) || 72;
        return hslToHex(Math.round(hh), ss, ll);
      }
      return ratingToHeatHex(value);
    } catch (e) {
      return "#6b7280";
    }
  }

  if (typeof tierOrRating === "number") return ratingToBandHex(tierOrRating);
  // if tier name given, map to its `min` value
  const t = macroTiers.find((m) => m.name === tierOrRating);
  if (t) return ratingToHeatHex(t.min);
  return "#6b7280";
}

export const skillLabels = [
  "Serve",
  "Return",
  "Forehand",
  "Backhand",
  "Volley",
  "Overhead",
  "Movement",
];
