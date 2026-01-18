"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddSessionForm from "../../../components/AddSessionForm";

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
  const [error, setError] = useState<string | null>(null);

  function todayLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const handleCancel = () => { try { router.push('/admin'); } catch (e) { window.location.href = '/admin'; } };

  const createPlayer = async () => {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/admin/create-player', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName })
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
  const Step1 = () => (
    <div style={{ padding: 20, maxWidth: 680 }}>
      <h2 style={{ marginTop: 0 }}>Add New Player</h2>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <input value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder="First name" style={{ padding: 8, flex: 1 }} />
        <input value={lastName} onChange={(e)=>setLastName(e.target.value)} placeholder="Last name" style={{ padding: 8, flex: 1 }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Initial session date</label>
        <input type="date" value={pageDate} onChange={(e)=>setPageDate(e.target.value)} style={{ padding: 8, marginTop: 6 }} />
      </div>

      {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleCancel} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
        <div>
          <button onClick={async () => {
            // create player then advance
            if (!firstName && !lastName) { setError('Enter a first or last name'); return; }
            const p = await createPlayer();
            if (p) {
              setStep(2);
            }
          }} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{creating ? 'Creating...' : 'Next'}</button>
        </div>
      </div>
    </div>
  );

  // Step 2: Stats using AddSessionForm (hide date/notes, don't auto-submit)
  const Step2 = () => (
    <div style={{ padding: 20, maxWidth: 780 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Add initial session for {player?.first_name || ''} {player?.last_name || ''}</h2>
      </div>
      <div style={{ marginTop: 12 }}>
        <AddSessionForm
          ref={formRef}
          player={player}
          hideDate
          hideNotes
          showSaveButton={false}
          navSlot={(
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Back</button>
              <button onClick={() => setStep(3)} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Next</button>
            </div>
          )}
        />
      </div>
    </div>
  );

  // Step 3: Notes and save
  const Step3 = () => {
    useEffect(() => {
      try { const s = formRef.current?.getState?.(); if (s && s.notes) setPageNotes(s.notes); } catch (e) {}
    }, []);

    return (
      <div style={{ padding: 20, maxWidth: 680 }}>
        <h2 style={{ marginTop: 0 }}>Add notes</h2>
        <div style={{ marginTop: 12 }}>
          <textarea value={pageNotes} onChange={(e)=>setPageNotes(e.target.value)} placeholder="Notes (coach comments, background)" style={{ width: '100%', minHeight: 120, padding: 8 }} />
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Back</button>
          <div>
            <button onClick={async () => {
              try {
                await formRef.current?.setState?.({ notes: pageNotes, date: pageDate });
                await formRef.current?.submit?.();
                try { router.push('/admin'); } catch (e) { window.location.href = '/admin'; }
              } catch (e) {
                setError('Failed to save session');
              }
            }} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
          </div>
        </div>
        {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      {step === 1 && <Step1 />}
      {step === 2 && player && <Step2 />}
      {step === 3 && player && <Step3 />}
    </div>
  );
}
