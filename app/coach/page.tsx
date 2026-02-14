"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlayerCard from "../components/PlayerCard";
import PlayerSearch from "../components/PlayerSearch";
import { supabase } from "../lib/supabaseClient";
import RequestCoachForm from "./RequestCoachForm";

export default function CoachDashboard() {
  const [players, setPlayers] = useState<any[] | null>(null);
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvedPlayerIds, setApprovedPlayerIds] = useState<Set<string> | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isCoach, setIsCoach] = useState<boolean | null>(null);

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
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load');
        const playersData = (json.players || []).slice().sort((a:any,b:any) => Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0));
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
        const ids = new Set<string>(playersList.map((p:any) => String(p.id)));
        setApprovedPlayerIds(ids);
      } catch (err) {
        if (mounted) setApprovedPlayerIds(new Set());
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (!user) { setIsCoach(null); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/account/is-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) });
        const j = await res.json();
        if (!mounted) return;
        setIsCoach(Boolean(j?.is_coach));
      } catch (err) {
        if (mounted) setIsCoach(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    try {
      if (isCoach) {
        try { document.cookie = 'pc_coach_authed=1; Path=/; Max-Age=3600'; } catch (e) {}
      } else {
        try { document.cookie = 'pc_coach_authed=; Path=/; Max-Age=0'; } catch (e) {}
      }
    } catch (e) {
      // ignore
    }
  }, [isCoach]);

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 720, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 6px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>Sign in as a coach to continue</h2>
        <Link href="/">Go to onboarding</Link>
      </div>
    </div>
  );

  // If user is signed in but isn't a coach yet, show request-access options
  if (user && isCoach === false) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 720, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 6px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>Looks like you don’t have coach access yet.</h2>
        <p style={{ marginTop: 8, marginBottom: 16 }}>You can request access to a coach profile to get started.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <RequestCoachForm user={user} adminEmail="info.jordantolbert@gmail.com" />
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/">Return to onboarding</Link>
        </div>
      </div>
    </div>
  );

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/favicon.ico" alt="CourtSense" width={48} height={48} style={{ borderRadius: 10, background: '#fff' }} />
          <h2 style={{ letterSpacing: 0.5, margin: 0, textAlign: 'center' }}>CourtSense</h2>
        </div>

        <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              try { router.push('/'); } catch (e) { window.location.href = '/'; }
              try { document.cookie = 'pc_coach_authed=; Path=/; Max-Age=0'; } catch (e) {}
            } catch (err:any) {
              alert(err?.message || String(err));
            }
          }} style={{ padding: '8px 12px', background: 'transparent', color: '#111', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>Sign out</button>
        </div>

        <div style={{ width: '100%', maxWidth: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
          <div style={{ flex: 1, maxWidth: 620 }}>
            <PlayerSearch players={players} onFiltered={(p)=>setFiltered(p)} />
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div style={{ flex: 1, maxWidth: 620, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isCoach ? (
              <Link href="/coach/players/new" style={{ textDecoration: 'none' }}>
                <div role="button" aria-label="Add player" title="Add player" style={{ width: 160, minHeight: 112, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', boxSizing: 'border-box', padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 1px 6px rgba(2,6,23,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(180deg,#fff,#f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px #00000005' }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--foreground, #111827)' }}>Add player</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Create a new player card</div>
                </div>
              </Link>
            ) : null}
            {(filtered ?? players).map((p:any) => {
              const pid = String(p.id);
              const hasAccess = approvedPlayerIds ? approvedPlayerIds.has(pid) : false;
              const owner = (p.supabase_user_id && p.supabase_user_id === user.id) || (p.email && user.email && String(p.email).toLowerCase() === String(user.email).toLowerCase());
              return (
                <div key={pid} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <PlayerCard player={p} maxStats={maxStats} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    { (hasAccess || owner) ? (
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
                    ) }
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
