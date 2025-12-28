"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={100} height={20} priority />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Player Cards MVP</h1>
          <Link href="/achievements"><button type="button" style={{ padding: '6px 10px', fontSize: 13, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Achievements</button></Link>
        </div>

        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <div style={{ padding: "20px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, alignItems: "start" }}>
            {players.map((p: any, i: number) => (
              <PlayerCard key={p.id} player={p} isTop={i === 0} maxStats={maxStats} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
