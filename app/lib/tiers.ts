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
  { name: "Elite Junior", min: 27 },
  { name: "College Performance", min: 30 },
  { name: "Professional Track", min: 33 },
];

export const tierColorMap: Record<string, string> = {
  Explorer: "#b76e2a",
  "Rally Starter": "#9ca3af",
  "Emerging Player": "#FFD700",
  "Developing Player": "#00b4d8",
  "Match Player": "#7c3aed",
  "Growth Player": "#ef4444",
  Competitor: "#111827",
  "Advanced Competitor": "#0b1220",
  "Performance Player": "#10b981",
  "Elite Junior": "#a78bfa",
  "College Performance": "#f59e0b",
  "Professional Track": "#06b6d4",
};

export function getMacroTier(rating: number) {
  for (let i = macroTiers.length - 1; i >= 0; i--) {
    if (rating >= macroTiers[i].min) return { ...macroTiers[i], index: i };
  }
  return { ...macroTiers[0], index: 0 };
}

export function getTierColor(tierOrRating: string | number) {
  if (typeof tierOrRating === "number") {
    const t = getMacroTier(tierOrRating);
    return tierColorMap[t.name] ?? "#6b7280";
  }
  return tierColorMap[tierOrRating] ?? "#6b7280";
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
