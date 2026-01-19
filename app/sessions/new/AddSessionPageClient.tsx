"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddSessionForm from "../../components/AddSessionForm";

export default function AddSessionPageClient({ playerId }: { playerId?: string | null }) {
  const router = useRouter();
  const formRef = useRef<any>(null);
  const [step, setStep] = useState<number>(1);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [pageDate, setPageDate] = useState<string>(todayLocal());
  const [pageNotes, setPageNotes] = useState<string>('');

  const handleClose = () => {
    try { router.back(); } catch (e) { router.push('/'); }
  };

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      try {
        const res = await fetch('/api/players');
        const data = await res.json();
        const players = data?.players || [];
        const p = players.find((x: any) => String(x.id) === String(playerId));
        if (p) setPlayerName(((p.first_name || '') + ' ' + (p.last_name || '')).trim());
      } catch (err) {
        // ignore
      }
    })();
  }, [playerId]);

  function todayLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Step 1: choose date
  const Step1 = () => {
    return (
      <div style={{ width: 393, height: 852, background: 'var(--card-bg)', padding: 24, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ margin: 0 }}>{playerName ? `Add New Session: ${playerName}` : 'Add New Session'}</h3>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>Session date</label>
            <input type="date" value={pageDate} onChange={(e)=>setPageDate(e.target.value)} style={{ width: 200, padding: 8, marginTop: 6 }} />
          </div>
        </div>

        {/* Card footer: Back (left) and Next (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
          <div>
            <button className="text-btn" onClick={() => { handleClose(); }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)' }}>Back</button>
          </div>
          <div>
            <button className="text-btn" onClick={() => { try { formRef.current?.setState?.({ date: pageDate }); } catch (e){} setStep(2); }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Next</button>
          </div>
        </div>
      </div>
    );
  };

  // Step 2: main grid (reuse AddSessionForm but hide date/notes and hide save button)
  const Step2 = () => {
    return (
    <div style={{ width: 393, height: 852, background: 'var(--card-bg)', padding: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48 }}>
        <h3 style={{ margin: 0 }}>{playerName ? `Add Session: ${playerName}` : 'Add Session'}</h3>
      </div>

      {/* Main content area: center-ish and allow form to fill available space */}
        <div style={{ marginTop: 12, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 369 }}>
          <AddSessionForm
            ref={formRef}
            player={{ id: playerId }}
            onClose={handleClose}
            onCreated={() => { setStep(1); router.push('/'); }}
            hideDate
            hideNotes
            showSaveButton={false}
            navSlot={(
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                <div>
                  <button className="text-btn" onClick={() => setStep((s) => Math.max(1, s - 1))} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)' }}>Back</button>
                </div>
                <div>
                  <button className="text-btn" onClick={() => setStep(3)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Next</button>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
    );
  };

  // Step 3: notes page styled per provided CSS (approximate)
  const Step3 = () => {
    // initialize pageNotes from form state if available when entering Step 3
    useEffect(() => {
      if (step !== 3) return;
      try { const s = formRef.current?.getState?.(); if (s?.notes) setPageNotes(s.notes); } catch (e) {}
    }, [step]);

    const notesRef = React.useRef<HTMLTextAreaElement | null>(null);
    const handleContainerClick = () => { try { notesRef.current?.focus(); } catch (e) {} };

    return (
      <div onClick={handleContainerClick} style={{ width: 393, height: 852, background: 'var(--card-bg)', padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 298 }}>
            <div style={{ width: 298, height: 22, fontFamily: 'Inter', fontSize: 16, lineHeight: '22px', color: 'var(--foreground)' }}>Notes</div>
            <textarea
              ref={notesRef}
              value={pageNotes}
              onChange={(e)=>setPageNotes(e.target.value)}
              tabIndex={0}
              onPointerDown={(e) => { e.stopPropagation(); (e.target as HTMLTextAreaElement).focus(); }}
              onPointerUp={(e) => { e.stopPropagation(); }}
              onMouseDown={(e) => { e.stopPropagation(); }}
              onClick={(e) => { e.stopPropagation(); (e.target as HTMLTextAreaElement).focus(); }}
              style={{ width: 298, minHeight: 120, padding: 12, background: 'var(--card-bg)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--card-fg)', position: 'relative', zIndex: 9999, pointerEvents: 'auto' }}
            />
          </div>
        </div>

        {/* Card footer: Back (left) and Save (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
          <div>
            <button className="text-btn" onClick={() => setStep((s) => Math.max(1, s - 1))} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)' }}>Back</button>
          </div>
          <div>
            <button className="text-btn" onClick={async () => {
              try {
                await formRef.current?.setState?.({ notes: pageNotes });
                await formRef.current?.submit?.();
                setStep(1);
                router.push('/');
              } catch (e) {}
            }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Save</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', background: 'var(--card-bg)' }}>
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
    </div>
  );
}
