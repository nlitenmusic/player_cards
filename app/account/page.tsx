"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});
  const [approvedPlayers, setApprovedPlayers] = useState<any[] | null>(null);
  const [isCoach, setIsCoach] = useState<boolean | null>(null);
  const [hasPlayerRole, setHasPlayerRole] = useState<boolean | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const router = useRouter();

  // If we just signed out (flag set), redirect immediately to profile choice to avoid rendering the sign-in card
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const f = window.sessionStorage.getItem('pc_signed_out');
        if (f) {
          try { window.sessionStorage.removeItem('pc_signed_out'); } catch (e) {}
          try { router.replace('/'); } catch (e) { window.location.replace(window.location.origin + '/'); }
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    let mounted = true;

    // initial auth check + subscribe to changes. If unauthenticated, redirect immediately
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        const u = data?.user ?? null;
        setUser(u);
        if (!u) {
          try { router.replace('/'); } catch (e) { try { window.location.replace(window.location.origin + '/'); } catch (err) {} }
          return;
        }
        setCheckedAuth(true);
      } catch (e) {
        try { router.replace('/'); } catch (err) { try { window.location.replace(window.location.origin + '/'); } catch (err2) {} }
        return;
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        try { router.replace('/'); } catch (e) { try { window.location.replace(window.location.origin + '/'); } catch (err) {} }
      } else {
        setCheckedAuth(true);
      }
    });

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data?.user ?? null;
        if (!mounted) return;
        if (!u) { setIsCoach(null); return; }
        try {
          const res = await fetch('/api/account/is-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: u.id }) });
          const j = await res.json();
          if (!mounted) return;
          setIsCoach(Boolean(j?.is_coach));
        } catch (e) {
          if (mounted) setIsCoach(false);
        }
      } catch (e) {
        if (mounted) setIsCoach(false);
      }
    })();

    return () => { mounted = false; (sub as any)?.subscription?.unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from('claim_requests').select('player_id').eq('requester_id', user.id);
        if (!mounted) return;
        const map: Record<string, boolean> = {};
        (data || []).forEach((r: any) => { map[String(r.player_id)] = true; });
        setRequestedMap(map);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (!user) { setApprovedPlayers(null); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/account/approved', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requester_id: user.id }) });
        const j = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          console.error('error fetching approved players', j?.error ?? j);
          setApprovedPlayers([]);
          return;
        }
        setApprovedPlayers(j.players || []);
      } catch (err) {
        console.error('unexpected error fetching approved players', err);
        if (mounted) setApprovedPlayers([]);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // detect player role: explicit `pc_role=player` cookie or any approved players (parent account)
  useEffect(() => {
    try {
      if (!user) { setHasPlayerRole(null); return; }
      const cookieHas = typeof document !== 'undefined' && document.cookie.includes('pc_role=player');
      if (cookieHas) { setHasPlayerRole(true); return; }
      // fallback: if approvedPlayers already loaded and non-empty, treat as player
      if (approvedPlayers && approvedPlayers.length > 0) { setHasPlayerRole(true); return; }
      setHasPlayerRole(false);
    } catch (e) {
      setHasPlayerRole(false);
    }
  }, [user, approvedPlayers]);

  async function search() {
    setLoading(true);
    try {
      const res = await fetch('/api/players');
      const j = await res.json();
      const all = j.players || [];
      const q = String(query || '').trim().toLowerCase();
      const filtered = q === '' ? all : all.filter((p: any) => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        return name.includes(q) || String(p.email || '').toLowerCase().includes(q);
      });
      setResults(filtered);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function requestClaim(playerId: string | number) {
    if (!user) return alert('Please sign in');
    try {
      const res = await supabase.from('claim_requests').insert([{ player_id: String(playerId), requester_id: user.id, requester_email: user.email, status: 'pending' }]).select('id');
      if (res.error) {
        console.error('supabase insert error', res.error);
        alert(res.error.message || JSON.stringify(res.error));
        return;
      }
      setRequestedMap((s) => ({ ...s, [String(playerId)]: true }));
      alert('Claim request submitted — an admin will review it.');
    } catch (err: any) {
      // improved error reporting for debugging
      console.error('unexpected error submitting claim request', err);
      const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      alert(msg || 'Failed to submit request');
    }
  }

  async function cancelClaim(playerId: string | number) {
    if (!user) return alert('Please sign in');
    try {
      const res = await supabase.from('claim_requests').delete().match({ player_id: String(playerId), requester_id: user.id });
      if (res.error) {
        console.error('supabase delete error', res.error);
        alert(res.error.message || JSON.stringify(res.error));
        return;
      }
      setRequestedMap((s) => ({ ...s, [String(playerId)]: false }));
      // optional: inform the user
    } catch (err: any) {
      console.error('unexpected error cancelling claim request', err);
      const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      alert(msg || 'Failed to cancel request');
    }
  }

  // While we check auth, render nothing to avoid any flash of the "Sign in" card.
  if (!checkedAuth) return null;
  if (!user) return null;

  return (
    <div className="account-container" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 980, margin: '0 auto' }}>
        <h2>Account</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 22, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(user.email||'').charAt(0).toUpperCase()}</div>
            )}
            <div className="muted" style={{ fontSize: 14 }}>{user.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Role badges */}
              {isCoach ? (
                <div style={{ padding: '6px 8px', background: '#111827', color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Coach</div>
              ) : null}
              {hasPlayerRole ? (
                <div style={{ padding: '6px 8px', background: '#e6f4ff', color: '#0b69ff', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Player</div>
              ) : null}
            </div>
            <button
              type="button"
              className="ios-btn small"
              onClick={async ()=>{
                try {
                  if (typeof window !== 'undefined') {
                    try { window.sessionStorage.setItem('pc_signed_out', '1'); } catch (e) {}
                  }
                  if (isCoach) { try { document.cookie = 'pc_coach_authed=; Path=/; Max-Age=0'; } catch (e) {} }
                  // fire-and-forget signOut, then navigate immediately to avoid interim rendering
                  supabase.auth.signOut().catch(()=>{});
                  try { window.location.replace(window.location.origin + '/'); } catch (err) { try { router.replace('/'); } catch (e) {} }
                } catch (e) {
                  try { window.location.replace(window.location.origin + '/'); } catch (err) {}
                }
              }}
            >Sign out</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 980, margin: '18px auto', padding: 16, borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search for your player by name or email" style={{ flex: 1, padding: '8px 10px' }} />
          <button className="ios-btn" onClick={search} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: '6px 0' }}>Your Approved Players</h3>
          {approvedPlayers === null ? (
            <div className="muted">Loading…</div>
          ) : approvedPlayers.length === 0 ? (
            <div className="muted">You don't have any approved players yet.</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {approvedPlayers.map((p:any) => (
                <Link key={p.id} href={`/account/player/${encodeURIComponent(String(p.id))}`} style={{ textDecoration: 'none' }}>
                  <div className="player-card" style={{ padding: 8, borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.avatar_url ? <img src={p.avatar_url} alt="avatar" style={{ width: 44, height: 44, objectFit: 'cover' }} /> : <div style={{ width: 44, height: 44 }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.first_name} {p.last_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.email || ''}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          {results === null ? (
            <div className="muted">No search yet — try entering a name.</div>
          ) : results.length === 0 ? (
            <div className="muted">No players matched your search.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {results.map((p:any) => (
                <div key={p.id} className="player-card" style={{ padding: 10, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.first_name} {p.last_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.email || ''}</div>
                    </div>
                    <div>
                      {requestedMap[String(p.id)] ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ color: '#0a7', fontWeight: 700 }}>Requested</div>
                          <button className="ios-btn small ghost" onClick={()=>cancelClaim(p.id)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="ios-btn" onClick={()=>requestClaim(p.id)}>Request claim</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: 'var(--card-bg)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, gap: 24 }}>
        <Link href="/">
          <button aria-label="Cards" title="Cards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" />
              </svg>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Cards</div>
          </button>
        </Link>

        <Link href="/leaderboards">
          <button aria-label="Leaderboards" title="Leaderboards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Leaderboards</div>
          </button>
        </Link>

        <Link href="/achievements">
          <button aria-label="Achievements" title="Achievements" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Achievements</div>
          </button>
        </Link>
        
        <Link href="/account">
          <button aria-label="Account" title="Account" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="account" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user ? ((user.email||'').charAt(0).toUpperCase()) : 'A'}</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Account</div>
          </button>
        </Link>
      </div>
      <style jsx>{`
        .account-container { --bg: #fff; --card-bg: #fff; --panel-bg: #fafafa; --text: #111; --muted: #666; --border: #eee; }
        .card { background: var(--card-bg); color: var(--text); border-radius: 8px; border: 1px solid var(--border); }
        .player-card { background: var(--panel-bg); border: 1px solid var(--border); color: var(--text); }
        .muted { color: var(--muted); }

        /* iOS-like pill buttons */
        .ios-btn {
          -webkit-appearance: none;
          appearance: none;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.06);
          background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
          box-shadow: 0 8px 20px rgba(2,6,23,0.06), inset 0 -1px 0 rgba(0,0,0,0.03);
          color: var(--text);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
        }
        .ios-btn.small { padding: 6px 8px; font-size: 12px; }
        .ios-btn.ghost { background: transparent; border: 1px solid rgba(0,0,0,0.06); box-shadow: none; }
        .ios-btn:active { transform: translateY(1px) scale(0.998); box-shadow: 0 3px 8px rgba(2,6,23,0.06); }
        .ios-btn:hover { box-shadow: 0 12px 30px rgba(2,6,23,0.06); }
        .ios-btn[disabled] { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }

        @media (prefers-color-scheme: dark) {
          .account-container { --bg: #090909; --card-bg: #0f0f10; --panel-bg: #121214; --text: #e6e6e6; --muted: #9aa0a6; --border: #222; }
          .ios-btn { background: linear-gradient(180deg, #0f0f10 0%, #0b0b0c 100%); border: 1px solid rgba(255,255,255,0.04); box-shadow: 0 8px 20px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.02); color: var(--text); }
          .ios-btn.ghost { border: 1px solid rgba(255,255,255,0.04); }
        }
      `}</style>
    </div>
  );
}
