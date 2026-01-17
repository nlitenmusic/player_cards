import React from "react";
import { createClient } from "@supabase/supabase-js";
import { headers } from 'next/headers';
import SkillBreakdown from "../../components/SkillBreakdown";
import Link from 'next/link';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export default async function BreakdownPage({ searchParams }: { searchParams?: Record<string, any> | Promise<Record<string, any>> }) {
	// Accept several common variants and fall back to Referer header when Next didn't pass searchParams
	let playerId: string | null = null;
	const sp = searchParams ? await searchParams : {};
	playerId = sp?.player_id ?? sp?.playerId ?? sp?.player ?? null;

	if (!playerId) {
		try {
			const h = await headers();
			const referer = h.get('referer') || h.get('referrer');
			if (referer) {
				try {
					const u = new URL(referer);
					playerId = u.searchParams.get('player_id') || u.searchParams.get('playerId') || u.searchParams.get('player');
				} catch (e) {}
			}
		} catch (e) {
			// ignore
		}
	}

	if (!playerId) {
		return (<div style={{ padding: 24 }}>Missing player_id query parameter.</div>);
	}

	// load player basic info
	const { data: players } = await supabaseServer.from('players').select('id, first_name, last_name').eq('id', playerId).limit(1);
	const player = (players && (players as any)[0]) || { id: playerId, first_name: '', last_name: '' };

	// load all sessions for this player
	const { data: sessions } = await supabaseServer
		.from('sessions')
		.select('id,session_date')
		.eq('player_id', playerId)
		.order('session_date', { ascending: false });

	if (!sessions || (sessions as any).length === 0) {
		return (
			<div style={{ padding: 24 }}>
				<div style={{ fontWeight: 700, marginBottom: 8 }}>{player.first_name} {player.last_name}</div>
				<div>No previous sessions found for this player.</div>
			</div>
		);
	}

	const sessionIds = (sessions as any).map((s: any) => s.id);

	// load all session_stats for those sessions
	const { data: allStats } = await supabaseServer
		.from('session_stats')
		.select('skill_type,c,p,a,s,t,session_id')
		.in('session_id', sessionIds);

	const SKILL_LABELS = ["serve","return","forehand","backhand","volley","overhead","movement"];

	// aggregate averages per skill/component
	const agg: Record<string, { c: number[]; p: number[]; a: number[]; s: number[]; t: number[] }> = {};
	type StatKey = 'c' | 'p' | 'a' | 's' | 't';
	for (const r of (allStats || []) as any[]) {
		const key = String(r.skill_type || '').trim().toLowerCase();
		if (!agg[key]) agg[key] = { c: [], p: [], a: [], s: [], t: [] };
		for (const k of ['c','p','a','s','t'] as StatKey[]) {
			const v = r[k as any];
			if (v !== null && v !== undefined && v !== '') {
				const n = Number(v);
				if (!Number.isNaN(n)) agg[key][k].push(n);
			}
		}
	}

	const aggregatedStats = SKILL_LABELS.map((label) => {
		const key = label;
		const bucket = agg[key] || { c: [], p: [], a: [], s: [], t: [] };
		const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length) * 100) / 100 : null);
		return {
			skill_type: key,
			c: avg(bucket.c),
			p: avg(bucket.p),
			a: avg(bucket.a),
			s: avg(bucket.s),
			t: avg(bucket.t),
		};
	});

	const sessionDate = `Aggregated from ${(sessions as any).length} sessions`;

	return (
		<div style={{ minHeight: '100vh', position: 'relative', paddingBottom: 92 }}>
			<header style={{ paddingTop: 48, display: 'flex', justifyContent: 'center' }}>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: 20, fontWeight: 700 }}>{(player?.first_name || '') + (player?.last_name ? ` ${player.last_name}` : '')}</div>
					<div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Skill breakdown</div>
				</div>
			</header>

			<SkillBreakdown stats={aggregatedStats} />

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

