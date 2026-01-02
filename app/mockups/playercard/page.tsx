import React from "react"
import MockPlayerCard from "../../components/MockPlayerCard"

export default function Page() {
  return (
    <main style={{ padding: 28, fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <h1 style={{ margin: 0, marginBottom: 18, fontSize: 20 }}>PlayerCard mockup (Bento-based)</h1>
      <p style={{ marginTop: 0, marginBottom: 18, color: "#555" }}>Quick local preview of the PlayerCard composed from Bento-style cards.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <MockPlayerCard />
      </div>
    </main>
  )
}
