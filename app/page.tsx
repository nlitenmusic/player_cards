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

function BandBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    Unstable: '#ef4444',
    Conditional: '#f97316',
    Functional: '#eab308',
    Competitive: '#84cc16',
    'Advanced / Pro-Track': '#06b6d4',
    'Tour Challenger': '#8b5cf6',
    'Tour Elite': '#8b5cf6',
  };
  const color = colors[name] || '#6b7280';
  return (
    <div style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: color, marginRight: 8 }} />
  );
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#111',
          fontSize: 14,
        }}
      >
        <span style={{ fontSize: 12, display: 'inline-block', width: 14 }}>{open ? '▾' : '▸'}</span>
        <strong style={{ fontWeight: 700 }}>{title}</strong>
      </button>
      {open ? <div style={{ marginTop: 8 }}>{children}</div> : null}
    </div>
  );
}

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

                  {/* Tour Challenger */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Tour Challenger" /><span>Tour Challenger (31–40)</span></h4>

                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>Depth consistently within 1–3 feet of baseline</li>
                        <li>Pace + spin combination maintained under full speed</li>
                        <li>Direction changes executed late and disguised</li>
                        <li>Can stack 8–12 high-quality shots</li>
                        <li>Balance preserved at full extension</li>
                        <li>Minimal variance shot-to-shot</li>
                        <li>Process is suffocating and repeatable.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Breaks only under exceptional execution.</li>
                        <li>Extreme physical fatigue (late 3rd set)</li>
                        <li>Opponent produces exceptional precision</li>
                        <li>Rare timing slip under extreme stretch</li>
                        <li>Breakdown is extremely rare and short-lived.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Slightly shorter defensive reply</li>
                        <li>Rare mistimed redirection</li>
                        <li>But recovery is immediate</li>
                        <li>Momentum almost never swings off one lapse.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Mid-rally short balls under neutral conditions</li>
                        <li>Loss of depth under standard pressure</li>
                        <li>Temporary collapse of consistent pace</li>
                      </ul>
                    </Collapsible>
                  </div>

                  {/* Tour Elite */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Tour Elite" /><span>Tour Elite (41–50)</span></h4>

                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>Depth consistently within 1–3 feet of baseline</li>
                        <li>Pace + spin combination maintained under full speed</li>
                        <li>Direction changes executed late and disguised</li>
                        <li>Can stack 8–12 high-quality shots</li>
                        <li>Balance preserved at full extension</li>
                        <li>Minimal variance shot-to-shot</li>
                        <li>Process is suffocating and repeatable.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Breaks only under exceptional execution.</li>
                        <li>Extreme physical fatigue (late 3rd set)</li>
                        <li>Opponent produces exceptional precision</li>
                        <li>Rare timing slip under extreme stretch</li>
                        <li>Breakdown is extremely rare and short-lived.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Slightly shorter defensive reply</li>
                        <li>Rare mistimed redirection</li>
                        <li>But recovery is immediate</li>
                        <li>Momentum almost never swings off one lapse.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Mid-rally short balls under neutral conditions</li>
                        <li>Loss of depth under standard pressure</li>
                        <li>Temporary collapse of consistent pace</li>
                      </ul>
                    </Collapsible>
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
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [showBandModal, setShowBandModal] = useState<boolean>(false);
  const [showOnboardingParam, setShowOnboardingParam] = useState<boolean>(false);
  const [hasRoleCookie, setHasRoleCookie] = useState<boolean | null>(null);
  const [players, setPlayers] = useState<any[] | null>(null);
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefetchedAchievements, setPrefetchedAchievements] = useState<Record<string, any[]> | null>(null);

  useEffect(() => {
    try {
      setHasRoleCookie(document.cookie.includes('pc_coach_authed=1'));
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>CourtSense</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>A Performance GPS For Player Development</div>
              </div>
            </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Header intentionally left minimal; account controls moved to bottom nav */}
          </div>
        </div>

        <div style={{ width: "100%", boxSizing: "border-box", padding: 8, paddingTop: 56, paddingBottom: 100 }}>
          <PlayerSearch players={players} onFiltered={(p)=>setFiltered(p)} variant="admin" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 12, boxSizing: "border-box", alignItems: "start" }}>
            {/* Band standardization explainer tile */}
            <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'linear-gradient(180deg,#fff,#fbfbfb)', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 104 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Band Standardization</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Explain</div>
              </div>
              <div style={{ fontSize: 12, color: '#444' }}>Quick primer on what the numeric bands mean and how progress is measured.</div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowBandModal(true)} style={{ border: 'none', background: '#111', color: '#fff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Learn more</button>
              </div>
            </div>
            {(filtered ?? players).map((p: any, i: number) => (
              <PlayerCard key={p.id} player={p} isTop={i === 0} maxStats={maxStats} showSessions={false} prefetchedAchievements={prefetchedAchievements ?? undefined} />
            ))}
          </div>
        </div>
      </main>

      {showAuthModal && (
        <div aria-hidden={false} style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 720, padding: 24 }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>Sign in or create an account to continue</h2>
              <ProfileChoice />
            </div>
          </div>
        </div>
      )}

      {/* Band standardization modal */}
      {showBandModal && (
        <div aria-hidden={false} style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(3px)' }} onClick={() => setShowBandModal(false)} />
          <div style={{ position: 'relative', width: 'min(920px, 96%)', maxHeight: '86vh', overflow: 'auto', padding: 20 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 12px 48px rgba(0,0,0,0.16)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>How Band Standardization Works</h2>
                <button aria-label="Close" onClick={() => setShowBandModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#111' }}>✕</button>
              </div>

              <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>
                <p style={{ marginTop: 0 }}>
                  Bands group numeric ratings into coach-observable levels so the CSR (CourtSense Rating) maps to consistent, actionable descriptions.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8 }}>
                  {/* Unstable */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Unstable" /><span>Unstable (0–6)</span></h4>
                    <Collapsible title="What the process looks like" defaultOpen={false}>
                      <ul>
                        <li>Inconsistent preparation</li>
                        <li>Contact point fluctuates</li>
                        <li>Balance frequently compromised</li>
                        <li>Ball height and depth vary widely</li>
                        <li>Can produce a good shot, but not predictably</li>
                      </ul>
                      <p style={{ margin: '6px 0' }}>Quality is accidental more than constructed.</p>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Any directional change</li>
                        <li>Any increase in pace</li>
                        <li>Movement while hitting</li>
                        <li>Slight time pressure</li>
                        <li>Breakdown threshold is very low.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Ball into net or long</li>
                        <li>Mishits</li>
                        <li>Short balls</li>
                        <li>Loss of rally within 1–3 shots</li>
                        <li>Points end quickly.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul><li>None</li></ul>
                    </Collapsible>

                    <Collapsible title="Anchors / common examples">
                      <p style={{ margin: 0 }}>Rally at 2–2.<br/>Player:<br/>Opponent misses after 2 balls<br/>OR<br/>Player hits one clean ball down the middle<br/>Opponent mishits<br/>Point won through opponent error or single clean contact, not construction.</p>
                    </Collapsible>
                  </div>

                  

                  {/* Conditional */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Conditional" /><span>Conditional (7–12)</span></h4>

                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>Can rally 4–6 balls at moderate pace</li>
                        <li>Better spacing and preparation</li>
                        <li>Depth fluctuates (some deep balls, many mid-court)</li>
                        <li>Quality depends on ball speed and comfort zone</li>
                        <li>Process holds if conditions are comfortable.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Opponent increases pace</li>
                        <li>Forced wide</li>
                        <li>Direction change under movement</li>
                        <li>Slight fatigue</li>
                        <li>Player attempts higher-risk shot than their stability supports</li>
                        <li>Breakdown tied to external condition shifts.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Net errors on direction change</li>
                        <li>Long balls when trying to add pace</li>
                        <li>Attack attempt off unstable base</li>
                        <li>Short ball created by over-accelerated swing</li>
                        <li>The rally often ends because they force instead of build.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Total inability to rally</li>
                        <li>Chronic mishits</li>
                        <li>Complete mechanical disorganization</li>
                        <li>They can play — but they mismanage difficulty.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Anchors / common examples">
                      <p style={{ margin: 0 }}>
                        Rally at 3–3.<br/>
                        Player:<br/>
                        Trades 3 crosscourt balls safely<br/>
                        Opponent hits shorter ball (not severely short, just mid-depth)<br/>
                        Player steps in<br/>
                        Hits firm ball crosscourt<br/>
                        Opponent misjudges and nets
                      </p>

                      <p style={{ marginTop: 8 }}>
                        When they win points from offense, it’s usually: because opponent cracks first or because the attack was obvious and high-percentage.
                      </p>
                    </Collapsible>
                  </div>

                  {/* Functional */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Functional" /><span>Functional (13–18)</span></h4>
                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>Can sustain 6–10 shot rallies</li>
                        <li>Depth more consistent</li>
                        <li>Directional control present</li>
                        <li>Can defend and recover</li>
                        <li>Beginning to construct points intentionally</li>
                        <li>Quality repeatable but not heavy or suffocating.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Sustained depth from opponent</li>
                        <li>High pace</li>
                        <li>Rapid direction changes</li>
                        <li>Fatigue late in sets</li>
                        <li>Breakdown now requires actual pressure.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Short ball appears under stress</li>
                        <li>Depth reduces</li>
                        <li>Defensive reply floats mid-court</li>
                        <li>Opponent gains control</li>
                        <li>But collapse is not immediate.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Frequent rally-ending errors under neutral conditions</li>
                        <li>Inability to sustain 5+ balls</li>
                        <li>Severe mechanical instability</li>
                        <li>Chronic mis-hits</li>
                        <li>They are match functional.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Won Point Example (Anchor)">
                      <p style={{ margin: 0 }}>
                        Rally at 4–4.<br/>
                        Player:<br/>
                        Trades 5 crosscourt balls<br/>
                        Changes direction safely<br/>
                        Opponent defends short<br/>
                        Player steps in and finishes<br/>
                        Point won through controlled rally + deliberate direction change.
                      </p>
                    </Collapsible>
                  </div>

                  {/* Competitive */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Competitive" /><span>Competitive (19–24)</span></h4>
                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>contact and rhythm are preserved during typical match-pressure situations</li>
                        <li>skills remain intact while constructing points tactically</li>
                        <li>Solid preparation and spacing</li>
                        <li>Good depth and directional intent</li>
                        <li>Can construct 3–5 shot sequences</li>
                        <li>Quality varies slightly from shot to shot</li>
                        <li>One or two balls per rally may land shorter or less heavy</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Breaks under strong, well-executed pressure from opponent. Few misses</li>
                        <li>Elevated pressure</li>
                        <li>Sudden pace increase</li>
                        <li>Direction change under time compression</li>
                        <li>Fatigue in longer exchanges</li>
                        <li>Timing and depth fluctuate.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Dependable skill outcomes with low error rates in matches</li>
                        <li>Ball lands shorter</li>
                        <li>Attackable mid-court ball appears</li>
                        <li>Serve percentage dips briefly</li>
                        <li>Rally control shifts</li>
                        <li>Breakdowns may last multiple points.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Skills breaking when no pressure is apparent</li>
                        <li>Frequent double faults</li>
                        <li>Wild mis-hits</li>
                        <li>Inability to rally</li>
                        <li>Poor basic spacing</li>
                        <li>They are stable — just not suffocating.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Anchors / common examples">
                      <p style={{ margin: 0 }}>
                        Skill remains consistent across games

                        Rally at 4–4.<br/>
                        Competitive player:<br/>
                        Hits solid crosscourt forehand<br/>
                        Keeps opponent neutral<br/>
                        Gets slightly shorter ball<br/>
                        Steps in and hits clean winner<br/>
                        Point won through solid construction + one opportunity ball.
                      </p>
                    </Collapsible>
                  </div>

                  {/* Advanced / Pro-Track */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Advanced / Pro-Track" /><span>Advanced / Pro-Track (25–30)</span></h4>

                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>Consistent depth within 3–4 feet of baseline</li>
                        <li>Better spacing and balance under pace</li>
                        <li>Can stack 5–8 high-quality balls in a row</li>
                        <li>Shot speed and spin are repeatable</li>
                        <li>Direction changes are stable</li>
                        <li>Variance window is smaller.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Breaks under sustained or layered pressure.</li>
                        <li>Sustained heavy rallies</li>
                        <li>Prolonged fatigue</li>
                        <li>Opponent applying repeated layered pressure</li>
                        <li>Deliberate max-power risk sequences</li>
                        <li>Breakdowns are brief and self-corrected.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Slight depth reduction</li>
                        <li>One short ball under prolonged pressure</li>
                        <li>Minor timing slip</li>
                        <li>But recalibration occurs quickly</li>
                        <li>Momentum rarely collapses.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Multi-point technical collapses</li>
                        <li>Serve implosion under routine pressure</li>
                        <li>Inability to handle sustained depth</li>
                        <li>Tactical confusion during neutral rallies</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Anchors / common examples">
                      <p style={{ margin: 0 }}>
                        Hits 4 consecutive deep heavy balls<br/>
                        Moves opponent 2–3 feet behind baseline<br/>
                        Changes direction safely with pace<br/>
                        Forces short reply<br/>
                        Finishes inside the court<br/>
                        Point won through sustained depth and pressure stacking, not just one good ball.
                      </p>
                    </Collapsible>
                  </div>

                  {/* Tour Challenger */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Tour Challenger" /><span>Tour Challenger (31–40)</span></h4>

                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>Depth consistently within 1–3 feet of baseline</li>
                        <li>Pace + spin combination maintained under full speed</li>
                        <li>Direction changes executed late and disguised</li>
                        <li>Can stack 8–12 high-quality shots</li>
                        <li>Balance preserved at full extension</li>
                        <li>Minimal variance shot-to-shot</li>
                        <li>Process is suffocating and repeatable.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Breaks only under exceptional execution.</li>
                        <li>Extreme physical fatigue (late 3rd set)</li>
                        <li>Opponent produces exceptional precision</li>
                        <li>Rare timing slip under extreme stretch</li>
                        <li>Breakdown is extremely rare and short-lived.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Slightly shorter defensive reply</li>
                        <li>Rare mistimed redirection</li>
                        <li>But recovery is immediate</li>
                        <li>Momentum almost never swings off one lapse.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Mid-rally short balls under neutral conditions</li>
                        <li>Loss of depth under standard pressure</li>
                        <li>Technical sequencing errors</li>
                        <li>Serve location drift in normal games</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Anchors / common examples">
                      <p style={{ margin: 0 }}>
                        Hits 6 heavy deep balls at full speed<br/>
                        Opponent matches pace<br/>
                        Player disguises direction at last millisecond<br/>
                        Ball lands within inches of sideline<br/>
                        Opponent reaches but floats defensive reply<br/>
                        Player finishes cleanly<br/>
                        Point won through elite precision layered on elite pace.
                      </p>
                    </Collapsible>
                  </div>

                  {/* Tour Elite */}
                  <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Tour Elite" /><span>Tour Elite (41–50)</span></h4>

                    <Collapsible title="What the process looks like">
                      <ul>
                        <li>Depth consistently within 1–3 feet of baseline</li>
                        <li>Pace + spin combination maintained under full speed</li>
                        <li>Direction changes executed late and disguised</li>
                        <li>Can stack 8–12 high-quality shots</li>
                        <li>Balance preserved at full extension</li>
                        <li>Minimal variance shot-to-shot</li>
                        <li>Process is suffocating and repeatable.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="When it breaks down">
                      <ul>
                        <li>Breaks only under exceptional execution.</li>
                        <li>Extreme physical fatigue (late 3rd set)</li>
                        <li>Opponent produces exceptional precision</li>
                        <li>Rare timing slip under extreme stretch</li>
                        <li>Breakdown is extremely rare and short-lived.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="What results occur as a result">
                      <ul>
                        <li>Slightly shorter defensive reply</li>
                        <li>Rare mistimed redirection</li>
                        <li>But recovery is immediate</li>
                        <li>Momentum almost never swings off one lapse.</li>
                      </ul>
                    </Collapsible>

                    <Collapsible title="Common failure traits absent from this band">
                      <ul>
                        <li>Mid-rally short balls under neutral conditions</li>
                        <li>Loss of depth under standard pressure</li>
                        <li>Temporary collapse of consistent pace</li>
                      </ul>
                    </Collapsible>
                  </div>
                  </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <div style={{ width: 56, height: 6, borderRadius: 9999, background: '#e5e7eb' }} />
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Swipe to view bands →</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowBandModal(false)} style={{ border: 'none', background: '#111', color: '#fff', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

        <button aria-label="Leaderboards" title="Leaderboards" type="button" onClick={() => { try { router.push('/leaderboards'); } catch (e) { try { window.location.href = '/leaderboards'; } catch (err) {} } }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="currentColor"/></svg>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Leaderboards</div>
        </button>

        <button aria-label="Achievements" title="Achievements" type="button" onClick={() => { try { router.push('/achievements'); } catch (e) { try { window.location.href = '/achievements'; } catch (err) {} } }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Achievements</div>
        </button>

        <button aria-label="Account" title="Account" type="button" onClick={() => { try { router.push('/account'); } catch (e) { try { window.location.href = '/account'; } catch (err) {} } }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="account" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 14, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user ? ((user.email||'').charAt(0).toUpperCase()) : 'A'}</div>
          )}
          <div style={{ fontSize: 11, color: '#6b7280' }}>Account</div>
        </button>
      </div>
    </div>
  );
}
