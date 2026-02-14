"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddSessionForm from "../../../components/AddSessionForm";
import { supabase } from "../../../lib/supabaseClient";

type Step1Props = {
	firstName: string;
	setFirstName: React.Dispatch<React.SetStateAction<string>>;
	lastName: string;
	setLastName: React.Dispatch<React.SetStateAction<string>>;
	pageDate: string;
	setPageDate: React.Dispatch<React.SetStateAction<string>>;
	error: string | null;
	creating: boolean;
	handleCancel: () => void;
	createPlayer: () => Promise<any>;
	setStep: React.Dispatch<React.SetStateAction<number>>;
};

function Step1(props: Step1Props) {
	const { firstName, setFirstName, lastName, setLastName, pageDate, setPageDate, error, creating, handleCancel, createPlayer, setStep } = props;
	return (
		<div style={{ padding: 20, maxWidth: 680 }}>
			<h2 style={{ marginTop: 0 }}>Add New Player</h2>
			<div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
				<input name="first_name" autoComplete="off" value={firstName ?? ''} onChange={(e)=>setFirstName(e.target.value)} placeholder="First name" style={{ padding: 8, flex: 1 }} />
				<input name="last_name" autoComplete="off" value={lastName ?? ''} onChange={(e)=>setLastName(e.target.value)} placeholder="Last name" style={{ padding: 8, flex: 1 }} />
			</div>
			<div style={{ marginTop: 12 }}>
				<label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Initial session date</label>
				<input type="date" value={pageDate ?? ''} onChange={(e)=>setPageDate(e.target.value)} style={{ padding: 8, marginTop: 6 }} />
			</div>

			{error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

			<div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
				<button onClick={handleCancel} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
				<div>
					<button onClick={async () => {
						if (!firstName && !lastName) { return; }
						const p = await createPlayer();
						if (p) setStep(2);
					}} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{creating ? 'Creating...' : 'Next'}</button>
				</div>
			</div>
		</div>
	);
}

type Step2Props = {
	formRef: React.RefObject<any>;
	player: any | null;
	setStep: React.Dispatch<React.SetStateAction<number>>;
	setRowsSnapshot: React.Dispatch<React.SetStateAction<any[] | null>>;
};

function Step2({ formRef, player, setStep, setRowsSnapshot }: Step2Props) {
	return (
		<div style={{ padding: 20, maxWidth: 780 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h2 style={{ margin: 0 }}>Add initial session for {player?.first_name || ''} {player?.last_name || ''}</h2>
			</div>
			<div style={{ marginTop: 12 }}>
				<AddSessionForm
					ref={formRef}
					player={player}
					showQuickFill={true}
					showArchetypes={true}
					hideDate
					hideNotes
					showSaveButton={false}
					suppressNoPreviousMessage={true}
					navSlot={(
						<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
							<button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Back</button>
							<button onClick={async () => {
								try {
									const s = await formRef.current?.getState?.();
									if (s?.rows) setRowsSnapshot(s.rows);
								} catch (e) {}
								setStep(3);
							}} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Next</button>
						</div>
					)}
				/>
			</div>
		</div>
	);
}

type Step3Props = {
	formRef: React.RefObject<any>;
	rowsSnapshot: any[] | null;
	pageNotes: string;
	setPageNotes: React.Dispatch<React.SetStateAction<string>>;
	pageDate: string;
	setStep: React.Dispatch<React.SetStateAction<number>>;
	setError: React.Dispatch<React.SetStateAction<string | null>>;
	routerPush: (path: string) => void;
	isCoach?: boolean | null;
	player: any | null;
	error: string | null;
	firstName: string;
	lastName: string;
};

function Step3({ formRef, rowsSnapshot, pageNotes, setPageNotes, pageDate, setStep, setError, routerPush, player, error, firstName, lastName, isCoach }: Step3Props) {
	useEffect(() => {
		try { const s = formRef.current?.getState?.(); if (s && s.notes) setPageNotes(s.notes); } catch (e) {}
	}, []);

	const notesTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
	const [saving, setSaving] = React.useState(false);

	const handleSave = async () => {
		setError(null);
		setSaving(true);
		try {
			const finalNotes = notesTextareaRef.current?.value ?? pageNotes;
			// If the form component is still mounted and exposes submit, prefer using it
			if (formRef.current?.submit) {
				if (rowsSnapshot && Array.isArray(rowsSnapshot)) {
					try { await formRef.current?.setState?.({ rows: rowsSnapshot }); } catch (e) {}
				}
				await formRef.current?.setState?.({ notes: finalNotes, date: pageDate });
				const state = await formRef.current?.getState?.();
				console.debug('AddPlayerPageClient: submitting form state via formRef', state);
				const hasAny = Array.isArray(state?.rows) && state.rows.some((r: any) => ['c','p','a','s','t'].some((k) => r[k] != null));
				if (!hasAny) { setError('Please enter at least one stat before saving'); setSaving(false); return; }
				await formRef.current?.submit?.();
				routerPush(isCoach ? '/coach' : '/admin');
				return;
			}

			// Otherwise, POST directly using the captured rowsSnapshot
			if (!rowsSnapshot || !Array.isArray(rowsSnapshot)) {
				setError('Please enter at least one stat before saving');
				setSaving(false);
				return;
			}
			const payload = { player_id: (formRef.current?.player?.id ?? null), session_date: pageDate, stats_components: rowsSnapshot, notes: finalNotes };
			let playerId = (payload as any).player_id || player?.id || (window as any)._currentPlayerId || null;
			if (!playerId) {
				// attempt to create the player now using provided names
				try {
					let requester_id: string | null = null;
					try { const userRes = await supabase.auth.getUser(); requester_id = (userRes?.data as any)?.user?.id ?? null; } catch (e) { requester_id = null; }
					const body: any = { first_name: firstName, last_name: lastName };
					if (requester_id) body.requester_id = requester_id;
					const createRes = await fetch('/api/admin/create-player', {
						method: 'POST', headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(body)
					});
					const createJson = await createRes.json();
					if (!createRes.ok) throw new Error(createJson?.error || 'Failed to create player');
					playerId = createJson.player?.id || null;
				} catch (e:any) {
					setError('Missing player id; cannot save session');
					setSaving(false);
					return;
				}
			}
			const res = await fetch('/api/admin/create-session', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ player_id: playerId, session_date: pageDate, stats_components: rowsSnapshot, notes: finalNotes })
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || 'Failed to create session');
			try { if (playerId) { fetch('/api/admin/compute-achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'player', player_id: playerId }) }).catch(()=>{}); } } catch(e){}
			routerPush(isCoach ? '/coach' : '/admin');
		} catch (e: any) {
			console.error('AddPlayerPageClient: save error', e);
			setError(e?.message ?? 'Failed to save session');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div style={{ padding: 20, maxWidth: 680 }}>
			<h2 style={{ marginTop: 0 }}>Add notes</h2>
			<div style={{ marginTop: 12 }}>
				<textarea value={pageNotes} onChange={(e)=>setPageNotes(e.target.value)} placeholder="Notes (coach comments, background)" style={{ width: '100%', minHeight: 120, padding: 8 }} />
			</div>
			{error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}
			<div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
				<button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Back</button>
				<div>
					<button onClick={handleSave} disabled={saving} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
				</div>
			</div>
		{/* error displayed above */}
		</div>
	);
}

export default function AddPlayerPageClient() {
	const router = useRouter();
	const formRef = useRef<any>(null);
	const [step, setStep] = useState<number>(1);
	const [firstName, setFirstName] = useState<string>("");
	const [lastName, setLastName] = useState<string>("");
	const [pageDate, setPageDate] = useState<string>(todayLocal());
	const [pageNotes, setPageNotes] = useState<string>('');
	const [creating, setCreating] = useState(false);
	const [player, setPlayer] = useState<any | null>(null);
	const [rowsSnapshot, setRowsSnapshot] = useState<any[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isCoach, setIsCoach] = useState<boolean | null>(null);

	function todayLocal() {
		const d = new Date();
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	useEffect(() => {
		(async () => {
			try {
				const userRes = await supabase.auth.getUser();
				const user = (userRes?.data as any)?.user;
				if (!user) { setIsCoach(null); return; }
				const res = await fetch('/api/account/is-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) });
				const j = await res.json();
				setIsCoach(Boolean(j?.is_coach));
			} catch (e) { setIsCoach(false); }
		})();
	}, []);

	const handleCancel = () => { const target = isCoach ? '/coach' : '/admin'; try { router.push(target); } catch (e) { window.location.href = target; } };

	const createPlayer = async () => {
		setError(null);
		setCreating(true);
		try {
			let requester_id: string | null = null;
			try { const userRes = await supabase.auth.getUser(); requester_id = (userRes?.data as any)?.user?.id ?? null; } catch (e) { requester_id = null; }
			const body: any = { first_name: firstName, last_name: lastName };
			if (requester_id) body.requester_id = requester_id;
			const res = await fetch('/api/admin/create-player', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || 'Failed to create player');
			setPlayer(json.player || null);
			return json.player || null;
		} catch (err:any) {
			setError(err?.message ?? String(err));
			return null;
		} finally { setCreating(false); }
	};

	useEffect(() => {
		// when moving to Step 2, ensure form has the selected date
		if (step === 2 && formRef.current) {
			try { formRef.current.setState?.({ date: pageDate }); } catch (e) {}
		}
	}, [step, pageDate]);

	// Step 1: Player name + date
	// Using top-level Step1 component (defined above)

	// Using top-level Step2 component (defined above)

	// Using top-level Step3 component (defined above)

	return (
		<div style={{ padding: 20 }}>
			{step === 1 && <Step1 firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} pageDate={pageDate} setPageDate={setPageDate} error={error} creating={creating} handleCancel={handleCancel} createPlayer={createPlayer} setStep={setStep} />}
			{step === 2 && player && <Step2 formRef={formRef} player={player} setStep={setStep} setRowsSnapshot={setRowsSnapshot} />}
			{step === 3 && player && <Step3 formRef={formRef} rowsSnapshot={rowsSnapshot} pageNotes={pageNotes} setPageNotes={setPageNotes} pageDate={pageDate} setStep={setStep} setError={setError} routerPush={(p:string)=>{try{router.push(p)}catch(e){window.location.href=p}}} player={player} error={error} firstName={firstName} lastName={lastName} isCoach={isCoach} />}
		</div>
	);
}
