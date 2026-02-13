"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProfileChoice() {
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);
	const [err, setErr] = useState<string | null>(null);

	const iosBtnBase: React.CSSProperties = { padding: '10px 14px', border: 'none', borderRadius: 9999, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'inline-block', lineHeight: '1' };
	const iosPrimary: React.CSSProperties = { ...iosBtnBase, background: '#007aff', color: '#fff', boxShadow: '0 6px 20px rgba(0,122,255,0.18)' };
	const iosSecondary: React.CSSProperties = { ...iosBtnBase, background: '#fff', color: '#007aff', border: '1px solid #e6eefb', boxShadow: '0 1px 3px rgba(2,6,23,0.04)' };

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
			setUser(session?.user ?? null);
		});
		return () => { mounted = false; (sub as any)?.subscription?.unsubscribe?.(); };
	}, []);

	async function handlePlayerGoogle() {
		setErr(null); setMsg(null); setLoading(true);
		try {
		const prodOrigin = process.env.NEXT_PUBLIC_PRODUCTION_ORIGIN || 'https://www.courtsense.net';
		const redirectTo = typeof window !== 'undefined'
			? (process.env.NODE_ENV === 'development' ? window.location.origin + '/' : prodOrigin + '/')
			: undefined;
		await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
			setMsg('Redirecting to Google for sign-in...');
		} catch (e: any) {
			setErr(e?.message ?? String(e));
		} finally { setLoading(false); }
	}

	async function handleCoachGoogle() {
		setErr(null); setMsg(null); setLoading(true);
		try {
		const prodOrigin = process.env.NEXT_PUBLIC_PRODUCTION_ORIGIN || 'https://www.courtsense.net';
		const redirectTo = typeof window !== 'undefined'
			? (process.env.NODE_ENV === 'development' ? window.location.origin + '/coach' : prodOrigin + '/coach')
			: undefined;
		await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
			setMsg('Redirecting to Google for sign-in...');
		} catch (e: any) {
			setErr(e?.message ?? String(e));
		} finally { setLoading(false); }
	}

	async function createProfile(asType: 'coach' | 'player') {
		setErr(null); setMsg(null); setLoading(true);
		try {
			if (!user) return setErr('Please sign in first');
			const body: any = { user_id: user.id, profile_type: asType };
			if (asType === 'coach') body.display_name = user.user_metadata?.full_name ?? user.email ?? null;
			if (asType === 'player') body.email = user.email ?? null;

			const res = await fetch('/api/account/create-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
			const j = await res.json();
			if (!res.ok) throw new Error(j?.error || 'Failed');
			setMsg(asType === 'coach' ? 'Coach profile created.' : 'Player profile created.');
		} catch (e: any) {
			setErr(e?.message ?? String(e));
		} finally { setLoading(false); }
	}

	if (!user) {
		return (
			<div style={{ maxWidth: 520 }}>
				<p>Choose a role to get started.</p>
				<br></br>
				<div style={{ display: 'flex', gap: 8 }}>
					<button onClick={handlePlayerGoogle} disabled={loading} style={iosPrimary}>Sign in as Player / Parent (Google)</button>
						<button onClick={handleCoachGoogle} disabled={loading} style={iosSecondary}>Sign in as Coach (Google)</button>
				</div>
				<p style={{ marginTop: 10, fontSize: 12, color: '#6b6b6b' }}>You will be redirected through a secure authentication service and returned to {process.env.NEXT_PUBLIC_PRODUCTION_ORIGIN || 'courtsense.net'} after signing in.</p>
				{msg ? <div style={{ marginTop: 8, color: 'green' }}>{msg}</div> : null}
				{err ? <div style={{ marginTop: 8, color: 'red' }}>{err}</div> : null}
			</div>
		);
	}

	return (
		<div style={{ maxWidth: 520 }}>
			<h3>Onboarding</h3>
			<p>Welcome, {user.email || user.id}. Choose which profile to create:</p>
			<div style={{ display: 'flex', gap: 8 }}>
				<button onClick={()=>createProfile('player')} disabled={loading} style={iosPrimary}>Create Player / Parent Profile</button>
				<button onClick={()=>createProfile('coach')} disabled={loading} style={iosSecondary}>Create Coach Profile</button>
			</div>
			{msg ? <div style={{ marginTop: 8, color: 'green' }}>{msg}</div> : null}
			{err ? <div style={{ marginTop: 8, color: 'red' }}>{err}</div> : null}
		</div>
	);
}

