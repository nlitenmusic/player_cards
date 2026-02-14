"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
import PlayerSearch from "./components/PlayerSearch";
import ProfileChoice from "./components/ProfileChoice";
import { supabase } from "./lib/supabaseClient";
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
  const router = useRouter();
  const [players, setPlayers] = useState<any[] | null>(null);
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefetchedAchievements, setPrefetchedAchievements] = useState<Record<string, any[]> | null>(null);

  // auth guard state
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
    const [hasRoleCookie, setHasRoleCookie] = useState<boolean | null>(null);
    const [showOnboardingParam, setShowOnboardingParam] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => { mounted = false; (sub as any)?.subscription?.unsubscribe?.(); };
  }, []);

    useEffect(() => {
      // check whether a role cookie has been set; if not, require explicit onboarding
      try {
        const roleMatch = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )pc_role=([^;\s]+)/) : null;
        setHasRoleCookie(Boolean(roleMatch && roleMatch[1]));
      } catch (e) {
        setHasRoleCookie(false);
      }
    }, [user]);

    useEffect(() => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search || '');
          if (params.get('showOnboarding') === '1') setShowOnboardingParam(true);
        }
      } catch (e) {
        // ignore
      }
    }, []);

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

        if (mounted) {
          // prefetch achievements for all loaded players to avoid per-card fetch flicker
          try {
            const map: Record<string, any[]> = {};
            await Promise.all(playersData.map(async (p: any) => {
              try {
                const res2 = await fetch(`/api/achievements/player?player_id=${encodeURIComponent(p.id)}`);
                if (!res2.ok) { map[p.id] = []; return; }
                const j2 = await res2.json();
                map[p.id] = j2?.achievements ?? [];
              } catch (err) {
                map[p.id] = [];
              }
            }));
            if (mounted) {
              setPlayers(playersData);
              setPrefetchedAchievements(map);
            }
          } catch (err) {
            console.error('prefetch achievements failed', err);
            if (mounted) {
              setPlayers(playersData);
              setPrefetchedAchievements({});
            }
          }
        }
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

  // show auth UI if not signed in
  if (authLoading) return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }} aria-hidden>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img src="/favicon.ico" alt="CourtSense" width={56} height={40} style={{ objectFit: 'contain' }} aria-hidden />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#111', animation: 'pc-blink 900ms infinite' }} />
      <style>{`@keyframes pc-blink {0% { opacity: 0.15; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.15; transform: scale(0.9); } }`}</style>
      </div>
    </div>
  );

  // show onboarding/modal when user is not signed in, or signed in but hasn't chosen a role
  const showAuthModal = !user || (user && hasRoleCookie === false && !document.cookie.includes('pc_coach_authed=1')) || showOnboardingParam;

  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  if (!players) return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }} aria-hidden>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img src="/favicon.ico" alt="CourtSense" width={56} height={40} style={{ objectFit: 'contain' }} aria-hidden />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#111', animation: 'pc-blink 900ms infinite' }} />
      <style>{`@keyframes pc-blink {0% { opacity: 0.15; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.15; transform: scale(0.9); } }`}</style>
      </div>
    </div>
  );
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/favicon.ico" alt="CourtSense" width={40} height={40} style={{ borderRadius: 8, background: '#fff' }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>CourtSense</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Header intentionally left minimal; account controls moved to bottom nav */}
          </div>
        </div>

        <div style={{ width: "100%", boxSizing: "border-box", padding: 8, paddingTop: 56, paddingBottom: 100 }}>
          <PlayerSearch players={players} onFiltered={(p)=>setFiltered(p)} variant="admin" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 12, boxSizing: "border-box", alignItems: "start" }}>
            {(filtered ?? players).map((p: any, i: number) => (
              <PlayerCard key={p.id} player={p} isTop={i === 0} maxStats={maxStats} showSessions={false} prefetchedAchievements={prefetchedAchievements ?? undefined} />
            ))}
          </div>
        </div>
      </main>

      {showAuthModal ? (
        <div aria-hidden={false} style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 720, padding: 24 }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>Sign in or create an account to continue</h2>
              <ProfileChoice />
            </div>
          </div>
        </div>
      ) : null}

      <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, gap: 24 }}>
        <button aria-label="Cards" title="Cards" type="button" onClick={() => { try { const isCoach = document.cookie.includes('pc_coach_authed=1'); if (isCoach) { router.push('/coach'); } else { router.push('/'); } } catch (e) { try { window.location.href = '/'; } catch (e) {} } }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="1" y="2" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <rect x="5" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" />
            </svg>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Cards</div>
        </button>

        <Link href="/leaderboards">
          <button aria-label="Leaderboards" title="Leaderboards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Leaderboards</div>
          </button>
        </Link>

        <Link href="/achievements">
          <button aria-label="Achievements" title="Achievements" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Achievements</div>
          </button>
        </Link>

        <Link href="/account">
          <button aria-label="Account" title="Account" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="account" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user ? ((user.email||'').charAt(0).toUpperCase()) : 'A'}</div>
            )}
            <div style={{ fontSize: 11, color: '#6b7280' }}>Account</div>
          </button>
        </Link>
      </div>
    </div>
  );
}
