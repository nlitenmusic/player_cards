import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';
const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export default async function PlayerAchievementsPage({ params }: { params: any }) {
  const p = await params;
  const playerId = p?.playerId;
  if (!playerId) return (<div style={{ padding: 24 }}>Missing player id.</div>);

  const { data: players } = await supabaseServer.from('players').select('id, first_name, last_name').eq('id', playerId).limit(1);
  const player = (players && (players as any)[0]) || { id: playerId, first_name: '', last_name: '' };

  const { data: paRows } = await supabaseServer
    .from('player_achievements')
    .select('awarded_at, metadata, achievements(id, name, description, icon_url)')
    .eq('player_id', playerId)
    .order('awarded_at', { ascending: false })
    .limit(200);

  const achievements = (paRows || []).map((r: any) => ({
    id: r.achievements?.id ?? null,
    name: r.achievements?.name ?? 'Achievement',
    description: r.achievements?.description ?? null,
    earned_at: r.awarded_at ?? null,
    icon: r.achievements?.icon_url ?? null,
  }));

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 92 }}>
      <header style={{ paddingTop: 48, display: 'flex', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{(player?.first_name || '') + (player?.last_name ? ` ${player.last_name}` : '')}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Player Achievements</div>
        </div>
      </header>

      <main style={{ padding: 24 }}>
        {(!achievements || (achievements as any).length === 0) ? (
          <div>No achievements found for this player.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {(achievements as any[]).map((a: any) => (
              <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 8, background: 'var(--card-bg)', boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}>
                {a.icon ? (
                  <img src={a.icon} alt="icon" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', background: '#fff' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: '#efefef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>🏅</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{a.name || 'Achievement'}</div>
                  {a.description ? <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{a.description}</div> : null}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{a.earned_at ? new Date(a.earned_at).toLocaleDateString() : ''}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, gap: 24 }}>
        <Link href="/">
          <button aria-label="Cards" title="Cards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" />
              </svg>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Cards</div>
          </button>
        </Link>
        
        <Link href="/achievements">
          <button aria-label="Achievements" title="Achievements" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1  -4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Achievements</div>
          </button>
        </Link>
      </div>
    </div>
  );
}
