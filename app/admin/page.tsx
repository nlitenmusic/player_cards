'use client';
import React, { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import AddSessionModal from "../components/AddSessionModal";
import Leaderboards from "../components/Leaderboards/Leaderboards";

export default function AdminDashboard() {
  const [players, setPlayers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalPlayer, setModalPlayer] = useState<any | null>(null);
  const [view, setView] = useState<'cards' | 'leaderboards'>('cards');

  const loadPlayers = async () => {
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

      setPlayers(playersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadPlayers();
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddStats = (player: any) => {
    setModalPlayer(player);
  };

  const handleEditPlayer = (player: any) => {
    console.log("Edit player:", player.id);
  };

  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  if (!players) return <div style={{ padding: 20 }}>Loading…</div>;

  const skillLabels = ["Serve","Return","Forehand","Backhand","Volley","Overhead","Movement"];
  const maxStats: Record<string, number> = {};
  skillLabels.forEach((label, idx) => {
    const keyLower = label.toLowerCase();
    maxStats[label] = Math.max(...players.map((p:any) => {
      const rowsRaw = p.row_averages ?? p.rowAverages ?? p.rowAveragesByName ?? [];
      if (Array.isArray(rowsRaw)) {
        return Number(rowsRaw[idx] ?? 0);
      }
      // object/map form - try multiple key normalizations
      const v = rowsRaw[label] ?? rowsRaw[label.toLowerCase()] ?? rowsRaw[label.replace(/\s+/g,'_').toLowerCase()];
      return Number(v ?? 0);
    }));
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard (edit mode)</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>Recalibrate baseline stats per-player (test mode writes to `test_session_stats`).</p>
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <button onClick={() => setView('cards')} style={{ marginRight: 8 }}>Cards</button>
        <button onClick={() => setView('leaderboards')}>Leaderboards</button>
      </div>
      {view === 'leaderboards' ? (
        <Leaderboards />
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Edit controls are enabled on each card.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 12 }}>
            {players.map((p:any) => (
              <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <PlayerCard
                  player={p}
                  isAdmin
                  maxStats={maxStats}
                  onAddStats={handleAddStats}
                  onEditPlayer={handleEditPlayer}
                />
                <div style={{ textAlign: "center" }}>
                  <button onClick={() => setModalPlayer(p)} style={{ padding: "6px 10px", fontSize: 13 }}>
                    + Add Session
                  </button>
                  {/* Recalibrate button removed per request */}
                </div>
              </div>
            ))}
          </div>

          {modalPlayer && (
            <AddSessionModal
              player={modalPlayer}
              onClose={() => setModalPlayer(null)}
              onCreated={() => {
                setModalPlayer(null);
                loadPlayers();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}