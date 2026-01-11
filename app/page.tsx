"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
import PlayerSearch from "./components/PlayerSearch";
import { getTierColor } from "./lib/tiers";

function RatingProgressBar({
  rating,
  tierStart,
  tierEnd,
}: {
  rating: number;
  tierStart: number;
  tierEnd: number;
}) {
  const clamped = Number.isFinite(rating) ? rating : 0;
  const pct = Math.max(0, Math.min(100, ((clamped - tierStart) / (tierEnd - tierStart)) * 100));
  // derive color from shared tier helper so progress bar matches badge
  const barColor = getTierColor(clamped);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        Progress to next level ({tierEnd})
      </div>

      <div
        style={{
          height: 10,
          width: "100%",
          background: "#e5e7eb",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            transition: "width 300ms ease",
          }}
        />
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>{Math.round(pct)}%</div>
    </div>
  );
}

// Replaced inline PlayerCard with shared component in `app/components/PlayerCard.tsx`.

export default function Home() {
  const [players, setPlayers] = useState<any[] | null>(null);
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/players");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");

        // sort players by avg_rating descending (highest first)
        const playersData = (json.players || []).slice().sort((a: any, b: any) => {
          const aVal = Number(a?.avg_rating ?? 0);
          const bVal = Number(b?.avg_rating ?? 0);
          return bVal - aVal;
        });

        if (mounted) setPlayers(playersData);
      } catch (err) {
        console.error(err);
        if (mounted) {
          const message = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Error loading players');
          setError(message);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  if (!players) return <div style={{ padding: 20 }}>Loading…</div>;
  if (players.length === 0) return <div style={{ padding: 20 }}>No players found.</div>;

  // compute top values per skill across all players
  const skillLabels = ["Serve", "Return", "Forehand", "Backhand", "Volley", "Overhead", "Movement"];
  const maxStats: Record<string, number> = {};
  skillLabels.forEach((label, idx) => {
    maxStats[label] = Math.max(...players.map((p) => Number(p.row_averages?.[idx] ?? 0)));
  });

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main style={{ paddingTop: 48 }} className="flex min-h-screen w-full flex-col items-start justify-between py-32 px-4 bg-white dark:bg-black">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', width: '100%', textTransform: 'uppercase' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Player</div>

          <div style={{ width: 40, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#fff', border: '2px solid #111', boxSizing: 'border-box' }}>
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="1" y="2" width="24" height="14" rx="2" stroke="#111" strokeWidth="1.5" fill="none" />
              <rect x="5" y="6" width="10" height="6" rx="1" stroke="#111" strokeWidth="1" fill="#f7f7f7" />
            </svg>
          </div>

          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Cards</div>
        </div>

        <div style={{ width: "100%", boxSizing: "border-box", padding: 8, paddingTop: 56, paddingBottom: 100 }}>
          <PlayerSearch players={players} onFiltered={(p)=>setFiltered(p)} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 12, boxSizing: "border-box", alignItems: "start" }}>
            {(filtered ?? players).map((p: any, i: number) => (
              <PlayerCard key={p.id} player={p} isTop={i === 0} maxStats={maxStats} showSessions={false} />
            ))}
          </div>
        </div>
      </main>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999 }}>
        <Link href="/achievements">
          <button aria-label="Achievements" title="Achievements" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="#111"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Achievements</div>
          </button>
        </Link>
      </div>
    </div>
  );
}
