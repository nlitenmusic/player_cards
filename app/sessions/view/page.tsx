"use client";

import React, { useEffect, useRef, useState } from "react";
import AddSessionForm from "../../components/AddSessionForm";
import { useRouter, useSearchParams } from "next/navigation";

const AddSessionFormAny = AddSessionForm as any;

export default function SessionsViewPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams?.get("player_id") ?? null;
  const sessionIdParam = searchParams?.get("session_id") ?? null;
  const router = useRouter();
  const formRef = useRef<any>(null);
  const [step, setStep] = useState<number>(1);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/player-sessions?player_id=${encodeURIComponent(String(playerId))}`);
        const json = await res.json();
        setSessions(json.sessions || []);
      } catch (e) {
        setSessions([]);
      }
    })();
  }, [playerId]);

  // Initialize selected session from query param when present
  useEffect(() => {
    if (sessionIdParam) setSelectedSessionId(String(sessionIdParam));
  }, [sessionIdParam]);

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      try {
        const res = await fetch('/api/players');
        const data = await res.json();
        const players = data?.players || [];
        const p = players.find((x: any) => String(x.id) === String(playerId));
        if (p) setPlayerName(((p.first_name || '') + ' ' + (p.last_name || '')).trim());
      } catch (err) {}
    })();
  }, [playerId]);

  const handleBack = () => {
    try { router.push('/admin'); } catch (e) { window.location.href = '/admin'; }
  };

  // Step1: list previous sessions + date selection
  const Step1 = () => {
    return (
      <div style={{ position: 'relative', width: 393, height: 852, background: '#ffffff', padding: 16, boxSizing: 'border-box', overflowX: 'hidden' }}>

        <div style={{ position: 'absolute', left: 26, top: 129, width: 340, height: 230 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#000', fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>View Sessions</span>
              <span style={{ fontWeight: 400 }}>{playerName ?? ''}</span>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#fff', marginBottom: 8 }}>Previous Sessions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((s) => {
                  const sid = String(s.id);
                  const isSelected = selectedSessionId === sid;
                  return (
                    <button
                      key={s.id}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedSessionId(sid);
                        try {
                          if (playerId) {
                            router.push(`/sessions/view?player_id=${encodeURIComponent(String(playerId))}&session_id=${encodeURIComponent(sid)}`);
                          }
                        } catch (e) {}
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 20,
                        background: '#000',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
                        boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.16)' : 'none',
                        color: '#fff',
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'box-shadow 120ms ease, transform 120ms ease'
                      }}
                    >
                      {String(s.session_date).slice(0,10)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleBack}
          style={{ position: 'absolute', left: 16, top: 794, padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 8, border: 'none' }}
        >
          Cancel
        </button>
        <button
          onClick={() => { setStep(2); }}
          style={{ position: 'absolute', right: 16, top: 794, padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 8, border: 'none' }}
        >
          Next
        </button>
      </div>
    );
  };

  // When entering Step 2, ensure the form receives the selectedSessionId (after it mounts)
  useEffect(() => {
    if (step === 2 && selectedSessionId) {
      try { formRef.current?.setState?.({ selectedSessionId, date: undefined }); } catch (e) {}
    }
  }, [step, selectedSessionId]);

  // Step2: session entry (AddSessionForm visible)
  const Step2 = () => (
    <div style={{ position: 'relative', width: 393, height: 852, background: '#ffffff', padding: 12, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#000' }}>{playerName ? `View Session: ${playerName}` : 'View Session'}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <AddSessionFormAny
          ref={formRef}
          player={{ id: playerId as string | null }}
          sessionId={selectedSessionId as string | null}
          hideDate
          hideNotes
          hideDelete
          showSaveButton={false}
          onSessionLoaded={((
        sid: string | null,
        n?: string
          ) => {
        try {
          if (sid && String(sid) === String(selectedSessionId)) setNotes(n ?? '');
        } catch (e) {}
          }) as (sid: string | null, notes?: string) => void}
        />
      </div>

      <button
        onClick={() => setStep(1)}
        style={{ position: 'absolute', left: 16, top: 794, padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 8, border: 'none' }}
      >
        Back
      </button>
      <button
        onClick={() => setStep(3)}
        style={{ position: 'absolute', right: 16, top: 794, padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 8, border: 'none' }}
      >
        Next
      </button>
    </div>
  );

  // Step3: notes entry
  const Step3 = () => {
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
      let cancelled = false;

      // Try to sync notes from the form. Retry a few times in case the form is still mounting/loading.
      const trySync = (attempt = 0) => {
        if (cancelled) return;
        try {
          const form = formRef.current;
          if (!form) {
            if (attempt < 5) return window.setTimeout(() => trySync(attempt + 1), 120);
            return;
          }

          const state = form.getState?.() ?? { notes: '', selectedSessionId: null };

          // If the form doesn't yet reflect the selectedSessionId, ask it to load it and retry.
          if (selectedSessionId && String(state.selectedSessionId || '') !== String(selectedSessionId)) {
            try { form.setState?.({ selectedSessionId }); } catch (e) {}
            if (attempt < 5) return window.setTimeout(() => trySync(attempt + 1), 120);
          }

          // Finally, read notes from the form state.
          const fresh = form.getState?.() ?? { notes: '' };
          if (!cancelled) setNotes(fresh.notes ?? '');
        } catch (e) {
          if (attempt < 5) return window.setTimeout(() => trySync(attempt + 1), 120);
        }
      };

      // Only sync when entering Step3 or when the selectedSessionId changes while on Step3
      if (step === 3) trySync();

      return () => { cancelled = true; };
    }, [step, selectedSessionId]);
    return (
      <div style={{ position: 'relative', width: 393, height: 852, background: '#ffffff', padding: 16, boxSizing: 'border-box' }}>

        <div style={{ position: 'absolute', left: 59, top: 312, width: 298, height: 145 }}>
          <div style={{ width: 298, height: 22, fontFamily: 'Inter', fontSize: 16, lineHeight: '22px', color: '#000' }}>Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: 298, minHeight: 80, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #D9D9D9' }} />
        </div>

        <button
          onClick={() => { try { formRef.current?.setState?.({ notes }); formRef.current?.submit?.(); } catch(e){} }}
          style={{ position: 'absolute', right: 16, top: 794, width: 77, height: 40, background: '#000', color: '#fff', border: 'none', borderRadius: 8 }}
        >
          Save
        </button>

        <button
          onClick={() => setStep(2)}
          style={{ position: 'absolute', left: 16, top: 794, padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 8, border: 'none' }}
        >
          Back
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
    </div>
  );
}
let _notesStore = '';

function setNotes(notes: string) {
    _notesStore = notes ?? '';
    try {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('playerCards:setNotes', { detail: _notesStore }));
        }
    } catch (e) {
        // swallow errors to preserve original behavior
    }
}

