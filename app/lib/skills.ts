export const SKILL_LABELS = [
  "Serve",
  "Return",
  "Forehand",
  "Backhand",
  "Volley",
  "Overhead",
  "Movement",
];

export const SKILL_KEYS = SKILL_LABELS.map((s) => s.toLowerCase());

export const CPAST = [
  { key: "c", label: "Consistency" },
  { key: "p", label: "Power" },
  { key: "a", label: "Accuracy" },
  { key: "s", label: "Spin" },
  { key: "t", label: "Technique" },
];

export function normalizeSkill(s: string) {
  return String(s || "").trim().toLowerCase();
}

export function normalizeComp(c: string) {
  return String(c || "").trim().toLowerCase();
}
