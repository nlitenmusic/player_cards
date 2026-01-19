'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import PlayerCard from "../components/PlayerCard";
import PlayerSearch from "../components/PlayerSearch";
import AddSessionModal from "../components/AddSessionModal";
import Leaderboards from "../components/Leaderboards/Leaderboards";

export default function AdminDashboard() {
  const [players, setPlayers] = useState<any[] | null>(null);
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalPlayer, setModalPlayer] = useState<any | null>(null);
  const [view, setView] = useState<'cards' | 'leaderboards' | 'achievements'>('cards');
  const [authed, setAuthed] = useState<boolean>(false);
  const [pwAttempt, setPwAttempt] = useState<string>("");
  const [pwError, setPwError] = useState<string | null>(null);

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

  const router = useRouter();

  const handleAddStats = (player: any) => {
    const pid = player?.id ?? player?.playerId ?? '';
    try { router.push(`/sessions/new?player_id=${encodeURIComponent(String(pid))}`); } catch (e) { window.location.href = `/sessions/new?player_id=${encodeURIComponent(String(pid))}`; }
  };

  useEffect(() => {
    try {
      const flag = sessionStorage.getItem('pc_admin_authed');
      if (flag === '1') setAuthed(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const handlePwSubmit = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if ((pwAttempt || "").toString() === "CPAST") {
      try { sessionStorage.setItem('pc_admin_authed', '1'); } catch (e) {}
      setAuthed(true);
      setPwError(null);
      setPwAttempt("");
    } else {
      setPwError('Incorrect password');
      setPwAttempt("");
    }
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <form onSubmit={handlePwSubmit} style={{ width: 420, maxWidth: '100%', padding: 20, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', background: '#fff' }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Admin Access</h3>
          <div style={{ color: '#6b7280', marginBottom: 12, fontSize: 13 }}>Enter the admin password to continue.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              value={pwAttempt}
              onChange={(e) => setPwAttempt(e.target.value)}
              placeholder="Password"
              type="password"
              aria-label="Admin password"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>Unlock</button>
          </div>
          {pwError && <div style={{ marginTop: 10, color: 'crimson' }}>{pwError}</div>}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => { try { router.push('/'); } catch (e) { window.location.href = '/'; } }} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

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
    <div style={{ padding: 8, paddingTop: 56, paddingBottom: 100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h2 style={{ letterSpacing: 0.5, margin: 0, textAlign: 'center' }}>PLAYER CARDS</h2>

        <div style={{ width: '100%', maxWidth: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
          <div style={{ flex: 1, maxWidth: 620 }}>
            <PlayerSearch players={players} onFiltered={(p)=>setFiltered(p)} variant="admin" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="add-player-btn" onClick={() => { try { router.push('/admin/players/new'); } catch (e) { window.location.href = '/admin/players/new'; } }} aria-label="Add player" title="Add player" style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Top controls moved to bottom fixed menu */}
      {view === 'leaderboards' ? (
        <Leaderboards />
      ) : (
        <>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 12 }}>
            {(filtered ?? players).map((p:any) => (
              <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <PlayerCard
                  player={p}
                  isAdmin
                  maxStats={maxStats}
                  onAddStats={handleAddStats}
                  onEditPlayer={handleEditPlayer}
                />
                {/* View Sessions button removed per request */}
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

        {/* Fixed bottom menu bar (match homepage styles for dark mode) */}
        <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, gap: 24 }}>
          <button onClick={() => setView('cards')} aria-pressed={view === 'cards'} style={{ color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" fill="currentColor"/><rect x="14" y="3" width="7" height="7" fill="currentColor"/><rect x="3" y="14" width="7" height="7" fill="currentColor"/><rect x="14" y="14" width="7" height="7" fill="currentColor"/></svg>
            <div style={{ fontSize: 11 }}>Cards</div>
          </button>

          <button onClick={() => { setView('leaderboards'); try { router.push('/admin/leaderboards'); } catch (e) { window.location.href = '/admin/leaderboards'; } }} aria-pressed={view === 'leaderboards'} style={{ color: view === 'leaderboards' ? '#000' : '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11 }}>Leaderboards</div>
          </button>

          <button onClick={() => { setView('achievements'); try { router.push('/admin/achievements'); } catch (e) { window.location.href = '/admin/achievements'; } }} aria-pressed={view === 'achievements'} style={{ color: view === 'achievements' ? '#000' : '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11 }}>Achievements</div>
          </button>

        </div>
    </div>
  );
}