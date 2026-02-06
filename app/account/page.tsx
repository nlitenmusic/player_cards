"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});
  const [approvedPlayers, setApprovedPlayers] = useState<any[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data?.user ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
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

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 640, width: '100%', padding: 18, borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Sign in to access your account</h2>
        <p><Link href="/">Return home</Link></p>
      </div>
    </div>
  );

  return (
    <div className="account-container" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 980, margin: '0 auto' }}>
        <h2>Account</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="muted" style={{ fontSize: 14 }}>{user.email}</div>
          <button type="button" onClick={async ()=>{ await supabase.auth.signOut(); if (typeof window !== 'undefined') { window.location.replace(window.location.origin + '/'); } }} style={{ padding: '6px 10px' }}>Sign out</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 980, margin: '18px auto', padding: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search for your player by name or email" style={{ flex: 1, padding: '8px 10px' }} />
          <button onClick={search} disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Searching…' : 'Search'}</button>
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
                <Link key={p.id} href={`/sessions/breakdown?player_id=${encodeURIComponent(String(p.id))}`} style={{ textDecoration: 'none' }}>
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
                          <button onClick={()=>cancelClaim(p.id)} style={{ padding: '6px 8px', fontSize: 12 }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={()=>requestClaim(p.id)} style={{ padding: '6px 10px' }}>Request claim</button>
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
      </div>
      <style jsx>{`
        .account-container { --bg: #fff; --card-bg: #fff; --panel-bg: #fafafa; --text: #111; --muted: #666; --border: #eee; }
        .card { background: var(--card-bg); color: var(--text); border-radius: 8px; border: 1px solid var(--border); }
        .player-card { background: var(--panel-bg); border: 1px solid var(--border); color: var(--text); }
        .muted { color: var(--muted); }
        @media (prefers-color-scheme: dark) {
          .account-container { --bg: #090909; --card-bg: #0f0f10; --panel-bg: #121214; --text: #e6e6e6; --muted: #9aa0a6; --border: #222; }
        }
      `}</style>
    </div>
  );
}
