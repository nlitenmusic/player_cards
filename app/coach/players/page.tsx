"use client";
import React, { useEffect, useState } from 'react';
import PlayerSearch from "../../components/PlayerSearch";
import PlayerCard from "../../components/PlayerCard";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from 'next/navigation';

export default function CoachPlayersPage() {
  const [players, setPlayers] = useState<any[] | null>(null);
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const [approvedPlayerIds, setApprovedPlayerIds] = useState<Set<string> | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch (e) {}
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; (sub as any)?.subscription?.unsubscribe?.(); };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/players');
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || 'Failed to load');
        const playersData = (j.players || []).slice().sort((a:any,b:any) => Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0));
        if (mounted) setPlayers(playersData);
      } catch (err:any) {
        if (mounted) setError(err?.message ?? String(err));
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user) { setApprovedPlayerIds(null); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/account/approved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requester_id: user.id }) });
        const j = await res.json();
        if (!mounted) return;
        if (!res.ok) { setApprovedPlayerIds(new Set()); return; }
        const playersList = j.players || [];
        setApprovedPlayerIds(new Set(playersList.map((p:any) => String(p.id))));
      } catch (err) {
        if (mounted) setApprovedPlayerIds(new Set());
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  if (!players) return <div style={{ padding: 20 }}>Loading…</div>;

  const skillLabels = ["Serve","Return","Forehand","Backhand","Volley","Overhead","Movement"];
  const maxStats: Record<string, number> = {};
  skillLabels.forEach((label, idx) => {
    maxStats[label] = Math.max(...players.map((p:any) => {
      const rowsRaw = p.row_averages ?? p.rowAverages ?? p.rowAveragesByName ?? [];
      if (Array.isArray(rowsRaw)) return Number(rowsRaw[idx] ?? 0);
      const v = rowsRaw[label] ?? rowsRaw[label.toLowerCase()] ?? rowsRaw[label.replace(/\s+/g,'_').toLowerCase()];
      return Number(v ?? 0);
    }));
  });

  return (
    <div style={{ padding: 8, paddingTop: 56, paddingBottom: 100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Players</h2>

        <div style={{ width: '100%', maxWidth: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
          <div style={{ flex: 1, maxWidth: 620 }}>
            <PlayerSearch players={players} onFiltered={(p)=>setFiltered(p)} />
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div style={{ flex: 1, maxWidth: 620, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(filtered ?? players).map((p:any) => {
              const pid = String(p.id);
              const hasAccess = approvedPlayerIds ? approvedPlayerIds.has(pid) : false;
              const owner = (p.supabase_user_id && p.supabase_user_id === user?.id) || (p.email && user?.email && String(p.email).toLowerCase() === String(user.email).toLowerCase());
              return (
                <div key={pid} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <PlayerCard player={p} maxStats={maxStats} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {owner || hasAccess ? (
                      <button onClick={() => { try { router.push(`/sessions/new?player_id=${encodeURIComponent(pid)}&return_to=/coach`); } catch (e) { window.location.href = `/sessions/new?player_id=${encodeURIComponent(pid)}&return_to=/coach`; } }} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Add session</button>
                    ) : (
                      <button onClick={async () => {
                        try {
                          const payload = { player_id: pid, requester_id: user.id, requester_email: user.email ?? null, status: 'pending' };
                          const { error } = await supabase.from('claim_requests').insert(payload);
                          if (error) throw error;
                          alert('Request submitted — an admin will review it.');
                        } catch (err:any) {
                          alert(err?.message || String(err));
                        }
                      }} style={{ padding: '8px 12px', background: 'transparent', color: '#0b69ff', border: '1px solid #e6eefb', borderRadius: 6, cursor: 'pointer' }}>Request access</button>
                    )}
                    <button onClick={() => { try { router.push('/coach/players/new'); } catch (e) { window.location.href = '/coach/players/new'; } }} style={{ padding: '8px 12px', background: 'transparent', color: '#6b7280', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer' }}>Create player</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
