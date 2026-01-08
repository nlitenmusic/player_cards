"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddSessionForm from "../../components/AddSessionForm";

export default function AddSessionPageClient({ playerId }: { playerId?: string | null }) {
  const router = useRouter();
  const formRef = useRef<any>(null);
  const [step, setStep] = useState<number>(1);
  const [playerName, setPlayerName] = useState<string | null>(null);

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

  // Step 1: choose date
  const Step1 = () => {
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
    return (
      <div style={{ width: 393, height: 852, background: '#fff', padding: 24, boxSizing: 'border-box' }}>
        <h3>Add Session — Select date</h3>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Session date</label>
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} style={{ width: 200, padding: 8, marginTop: 6 }} />
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handleClose} style={{ padding: '8px 12px' }}>Cancel</button>
          <button onClick={() => {
            // initialize form date and go next
            try { formRef.current?.setState?.({ date }); } catch (e) {}
            setStep(2);
          }} style={{ padding: '8px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4 }}>Next</button>
        </div>
      </div>
    );
  };

  // Step 2: main grid (reuse AddSessionForm but hide date/notes and hide save button)
  const Step2 = () => (
    <div style={{ width: 393, height: 852, background: '#fff', padding: 12, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{playerName ? `Add Session: ${playerName}` : 'Add Session'}</h3>
        <div>
          <button onClick={() => setStep(1)} style={{ marginRight: 8 }}>Back</button>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 13 }}>Session details below</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button onClick={() => setStep(1)} style={{ padding: '8px 12px' }}>Back</button>
        <button onClick={() => setStep(3)} style={{ padding: '8px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4 }}>Next</button>
      </div>
    </div>
  );

  // Step 3: notes page styled per provided CSS (approximate)
  const Step3 = () => {
    const s = formRef.current?.getState?.() ?? { rows: [], date: new Date().toISOString().slice(0,10), notes: '', selectedSessionId: null };
    const [notes, setNotes] = useState<string>(s.notes ?? '');
    return (
      <div style={{ position: 'relative', width: 393, height: 852, background: '#585858', padding: 16, boxSizing: 'border-box' }}>
        <div style={{ position: 'absolute', width: 393, height: 48, left: 0, top: 0, background: '#D9D9D9' }} />
        <div style={{ position: 'absolute', left: 169, top: 17, width: 55, height: 15, fontFamily: 'Inter', fontSize: 12, lineHeight: '15px', color: '#000' }}>Safe area</div>

        <div style={{ position: 'absolute', left: 59, top: 312, width: 298, height: 145 }}>
          <div style={{ width: 298, height: 22, fontFamily: 'Inter', fontSize: 16, lineHeight: '22px', color: '#fff' }}>Notes</div>
          <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} style={{ width: 298, minHeight: 80, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #D9D9D9' }} />
        </div>

        <div style={{ position: 'absolute', left: 289, top: 790, width: 77, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => { try { formRef.current?.setState?.({ notes }); formRef.current?.submit?.(); } catch(e){} }} style={{ width: 77, height: 40, background: '#2C2C2C', color: '#F5F5F5', border: '1px solid #2C2C2C', borderRadius: 8 }}>Save</button>
        </div>

        <div style={{ position: 'absolute', left: 16, top: 60 }}>
          <button onClick={() => setStep(2)} style={{ padding: '6px 10px' }}>Back</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}

      {/* Keep the form mounted so Step3 can call submit via ref. It's visually shown only on Step 2. */}
      <div style={{ display: step === 2 ? 'block' : 'none', marginLeft: 16 }}>
        <AddSessionForm ref={formRef} player={{ id: playerId }} onClose={handleClose} onCreated={() => { setStep(1); router.push('/'); }} hideDate hideNotes showSaveButton={false} />
      </div>
    </div>
  );
}
