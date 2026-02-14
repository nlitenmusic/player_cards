"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AvatarUpload from '../../../components/AvatarUpload';
import { supabase } from '../../../lib/supabaseClient';

export default function EditPlayerPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const playerId = params?.id ?? null;
  const [player, setPlayer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!playerId) return;
      try {
        const res = await fetch('/api/players');
        const j = await res.json();
        const list = j.players || [];
        const found = list.find((p: any) => String(p.id) === String(playerId));
        if (!mounted) return;
        setPlayer(found ?? null);
      } catch (e) {
        if (mounted) setPlayer(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [playerId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id || !playerId) { if (mounted) setIsOwner(false); return; }
      try {
        const res = await fetch('/api/account/approved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requester_id: user.id }) });
        if (!res.ok) { if (mounted) setIsOwner(false); return; }
        const j = await res.json();
        const players = j.players || [];
        const found = players.find((p: any) => String(p.id) === String(playerId));
        if (!mounted) return;
        setIsOwner(Boolean(found));
      } catch (e) {
        if (mounted) setIsOwner(false);
      }
    })();
    return () => { mounted = false; };
  }, [user, playerId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch (e) {
        // ignore
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; (sub as any)?.subscription?.unsubscribe?.(); };
  }, []);

  if (!playerId) return <div style={{ padding: 24 }}>No player specified</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!player) return <div style={{ padding: 24 }}>Player not found</div>;

  return (
    <div style={{ padding: 24 }}>
      <div className="ios-card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Edit player: {player.first_name} {player.last_name}</h2>
        <br></br>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#eee' }}>
            {player.avatar_url ? <img src={player.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%' }} />}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{player.first_name} {player.last_name}</div>
            <div style={{ color: '#666', fontSize: 13 }}>{player.email ?? ''}</div>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <h3 style={{ margin: '6px 0' }}>Profile picture</h3>
          <AvatarUpload playerId={player.id} currentAvatar={player.avatar_url} onUploaded={(url)=>{ setPlayer((p:any)=> ({ ...p, avatar_url: url })); }} />
        </div>

        <div style={{ marginTop: 18 }}>
          <button className="ios-btn" onClick={() => router.back()}>Done</button>
        </div>
      </div>
      <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: 'var(--card-bg)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, gap: 24 }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <button aria-label="Cards" title="Cards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" />
              </svg>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Cards</div>
          </button>
        </a>

        <a href="/leaderboards" style={{ textDecoration: 'none' }}>
          <button aria-label="Leaderboards" title="Leaderboards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Leaderboards</div>
          </button>
        </a>

        <a href="/achievements" style={{ textDecoration: 'none' }}>
          <button aria-label="Achievements" title="Achievements" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Achievements</div>
          </button>
        </a>
        
        <a href="/account" style={{ textDecoration: 'none' }}>
          <button aria-label="Account" title="Account" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="account" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user ? ((user.email||'').charAt(0).toUpperCase()) : 'A'}</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Account</div>
          </button>
        </a>
      </div>
      {isOwner && (
        <div style={{ position: 'fixed', right: 18, bottom: 86, zIndex: 10001 }}>
          <button
            aria-label="Add session"
            title="Add session"
            onClick={() => {
              try { router.push(`/sessions/new?player_id=${encodeURIComponent(String(playerId))}&return_to=/account`); } catch (e) { window.location.href = `/sessions/new?player_id=${encodeURIComponent(String(playerId))}&return_to=/account`; }
            }}
            style={{ width: 56, height: 56, borderRadius: 28, background: '#111', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(2,6,23,0.18)', cursor: 'pointer' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}
      <style jsx>{`
        .ios-card { background: var(--card-bg, #fff); padding: 18px; border-radius: 14px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); border: 1px solid rgba(0,0,0,0.04); }

        .ios-btn {
          -webkit-appearance: none;
          appearance: none;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.06);
          background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
          box-shadow: 0 10px 24px rgba(2,6,23,0.06), inset 0 -1px 0 rgba(0,0,0,0.03);
          color: var(--text, #111);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
        }
        .ios-btn:active { transform: translateY(1px) scale(0.998); box-shadow: 0 4px 12px rgba(2,6,23,0.06); }
        .ios-btn[disabled] { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }

        @media (prefers-color-scheme: dark) {
          .ios-card { background: #0f0f10; border: 1px solid rgba(255,255,255,0.04); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
          .ios-btn { background: linear-gradient(180deg, #0f0f10 0%, #0b0b0c 100%); border: 1px solid rgba(255,255,255,0.04); color: var(--text, #e6e6e6); box-shadow: 0 10px 24px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.02); }
        }
      `}</style>
    </div>
  );
}
