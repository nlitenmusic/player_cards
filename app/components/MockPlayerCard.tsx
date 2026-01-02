"use client"
import React from "react"

import bentoTokens from "../design/bentoTokens"

export default function MockPlayerCard() {
  const badges = [
    { title: "Consistency", color: "#FFD166" },
    { title: "Power", color: "#6ECFF6" },
    { title: "Accuracy", color: "#8EE5A5" },
  ]

  return (
    <div
      style={{
        width: 320,
        fontFamily: bentoTokens.font.family,
        borderRadius: bentoTokens.radii.lg,
        boxShadow: bentoTokens.shadows.card,
        padding: bentoTokens.spacing.sm,
        background: bentoTokens.colors.cardBg,
        color: bentoTokens.colors.primaryText,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: bentoTokens.spacing.xs * 1.5 }}>
        <img
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&q=80&auto=format&fit=crop"
          alt="avatar"
          style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: bentoTokens.font.sizes.lg, fontWeight: bentoTokens.font.weights.bold }}>Alex Morgan</div>
          <div style={{ color: bentoTokens.colors.secondaryText, fontSize: bentoTokens.font.sizes.md, marginTop: bentoTokens.spacing.xs / 2 }}>Level 12 • Intermediate</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: bentoTokens.font.sizes.lg, fontWeight: bentoTokens.font.weights.bold }}>1784</div>
          <div style={{ fontSize: bentoTokens.font.sizes.sm, color: bentoTokens.colors.secondaryText }}>Rating</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: bentoTokens.spacing.xs, marginTop: bentoTokens.spacing.sm * 1.5 }}>
        <StatChip label="C 8.2" sub="Consistency" />
        <StatChip label="P 7.9" sub="Power" />
        <StatChip label="A 8.6" sub="Accuracy" />
      </div>

      <div style={{ marginTop: bentoTokens.spacing.md * 0.75 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: bentoTokens.spacing.xs * 0.75 }}>
          <div style={{ fontSize: bentoTokens.font.sizes.sm, color: bentoTokens.colors.primaryText }}>Progress to next level</div>
          <div style={{ fontSize: bentoTokens.font.sizes.sm, color: bentoTokens.colors.primaryText, fontWeight: bentoTokens.font.weights.bold }}>65%</div>
        </div>
        <div style={{ height: 10, background: bentoTokens.colors.border, borderRadius: bentoTokens.radii.md, overflow: "hidden" }}>
          <div style={{ width: "65%", height: "100%", background: `linear-gradient(90deg, ${bentoTokens.colors.accent}, #6EA8FF)` }} />
        </div>
      </div>

      <div style={{ marginTop: bentoTokens.spacing.md * 0.75 }}>
        <div style={{ fontSize: bentoTokens.font.sizes.md, fontWeight: bentoTokens.font.weights.bold, marginBottom: bentoTokens.spacing.xs }}>Badges</div>
        <div style={{ display: "flex", gap: bentoTokens.spacing.sm, alignItems: "center", minHeight: 48, maxHeight: 96, overflowY: "auto" }}>
          {badges.map((b) => (
            <div key={b.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 64 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: b.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 -6px 8px rgba(0,0,0,0.06)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15 8l6 .5-4.5 3.5L18 22l-6-3.5L6 22l1.5-9L3 8.5 9 8 12 2z" fill="rgba(15,23,42,0.12)" />
                </svg>
              </div>
              <div style={{ fontSize: bentoTokens.font.sizes.sm, fontWeight: bentoTokens.font.weights.bold, textAlign: "center", color: bentoTokens.colors.primaryText }}>{b.title}</div>
            </div>
          ))}
          {badges.length === 0 && <div style={{ color: bentoTokens.colors.secondaryText, fontSize: bentoTokens.font.sizes.md }}>No badges yet</div>}
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ background: bentoTokens.colors.border, padding: "8px 10px", borderRadius: 999, fontWeight: bentoTokens.font.weights.bold, fontSize: bentoTokens.font.sizes.md }}>{label}</div>
      {sub && <div style={{ fontSize: bentoTokens.font.sizes.sm, color: bentoTokens.colors.secondaryText, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
