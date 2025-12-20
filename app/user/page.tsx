'use client';
import React, { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";

export default function UserDashboard() {
  const [players, setPlayers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/players");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        const playersData = (json.players || []).slice().sort((a:any,b:any) => Number(b.avg_rating||0)-Number(a.avg_rating||0));
        if (mounted) setPlayers(playersData);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  if (!players) return <div style={{ padding: 20 }}>Loading…</div>;

  const skillLabels = ["Serve","Return","Forehand","Backhand","Volley","Overhead","Movement"];
  const maxStats: Record<string, number> = {};
  skillLabels.forEach((label, idx) => {
    maxStats[label] = Math.max(...players.map(p => Number(p.row_averages?.[idx] ?? 0)));
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>User Dashboard (read-only)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 12 }}>
        {players.map((p:any) => (
          <PlayerCard key={p.id} player={p} maxStats={maxStats} />
        ))}
      </div>
    </div>
  );
}