"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddSessionForm from "../../components/AddSessionForm";

export default function AddSessionPageClient({ playerId }: { playerId?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = typeof searchParams?.get === 'function' ? searchParams.get('return_to') : null;
  const clinicParam = typeof searchParams?.get === 'function' ? searchParams.get('clinic') : null;
  const formRef = useRef<any>(null);
  const [step, setStep] = useState<number>(1);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [pageDate, setPageDate] = useState<string>(todayLocal());
  const [pageNotes, setPageNotes] = useState<string>('');
  const [rowsSnapshot, setRowsSnapshot] = useState<any[] | null>(null);

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

  // If opened with ?clinic=1 then jump into the session form and enable clinic mode
  useEffect(() => {
    if (!clinicParam) return;
    try { setStep(2); } catch (e) {}
    const t = setTimeout(async () => {
      try { await formRef.current?.setState?.({ isClinic: true }); } catch (e) {}
    }, 60);
    return () => clearTimeout(t);
  }, [clinicParam]);

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
                <button className="text-btn" onClick={async () => { try { await formRef.current?.setState?.({ date: pageDate }); const s = await formRef.current?.getState?.(); if (s?.rows) setRowsSnapshot(s.rows); } catch (e){} setStep(2); }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Next</button>
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
            onCreated={() => {
              setStep(1);
              try {
                if (returnTo) router.push(returnTo);
                else router.back();
              } catch (e) { router.push(returnTo || '/'); }
            }}
            hideDate
            hideNotes
            showSaveButton={false}
            navSlot={(
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                <div>
                  <button className="text-btn" onClick={() => setStep((s) => Math.max(1, s - 1))} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)' }}>Back</button>
                </div>
                <div>
                  <button className="text-btn" onClick={async () => { try { const s = await formRef.current?.getState?.(); if (s?.rows) setRowsSnapshot(s.rows); } catch (e) {} setStep(3); }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Next</button>
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
    const notesRef = React.useRef<HTMLTextAreaElement | null>(null);
    const handleContainerClick = () => { try { notesRef.current?.focus(); } catch (e) {} };
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [responseBody, setResponseBody] = useState<any | null>(null);

    return (
      <div style={{ width: 393, height: 852, background: 'var(--card-bg)', padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 298 }}>
            <div style={{ width: 298, height: 22, fontFamily: 'Inter', fontSize: 16, lineHeight: '22px', color: 'var(--foreground)' }}>Notes</div>
            <textarea
              ref={notesRef}
              defaultValue={pageNotes}
              tabIndex={0}
              style={{ width: 298, minHeight: 120, padding: 12, background: 'var(--card-bg)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--card-fg)', position: 'relative', zIndex: 9999, pointerEvents: 'auto' }}
            />
            {statusMessage && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, color: saving ? '#6b7280' : '#111' }}>{statusMessage}</div>
                {responseBody && <pre style={{ marginTop: 6, maxHeight: 160, overflow: 'auto', background: '#f6f6f6', padding: 8 }}>{JSON.stringify(responseBody, null, 2)}</pre>}
              </div>
            )}
          </div>
        </div>

        {/* Card footer: Back (left) and Save (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
          <div>
            <button className="text-btn" onClick={() => setStep((s) => Math.max(1, s - 1))} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)' }}>Back</button>
          </div>
          <div>
            <button className="text-btn" onClick={async () => {
              setSaving(true);
              setStatusMessage('Saving...');
              setResponseBody(null);
              try {
                const finalNotes = notesRef.current?.value ?? pageNotes;
                // prefer getting the full state from the form; fall back to rowsSnapshot captured earlier
                const s = await formRef.current?.getState?.();
                const statsComponents = (s && Array.isArray(s.rows) && s.rows.length) ? s.rows : (rowsSnapshot ?? []);

                // client-side validation: server expects exactly 7 rows
                if (!Array.isArray(statsComponents) || statsComponents.length !== 7) {
                  setStatusMessage(`Save failed: stats_components must be 7 rows (got ${Array.isArray(statsComponents) ? statsComponents.length : 'none'})`);
                  setResponseBody({ stats_components: statsComponents });
                  console.warn('AddSessionPageClient: invalid stats_components', statsComponents);
                  setSaving(false);
                  return;
                }

                const payload = {
                  player_id: playerId ?? (s?.player?.id ?? null),
                  session_date: s?.date ?? pageDate,
                  stats_components: statsComponents,
                  notes: finalNotes
                };
                const isUpdate = !!s?.selectedSessionId;
                const endpoint = isUpdate ? '/api/admin/update-session' : '/api/admin/create-session';
                const res = await fetch(endpoint, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(isUpdate ? { session_id: s.selectedSessionId, session_date: payload.session_date, stats_components: payload.stats_components, notes: payload.notes } : payload)
                });
                const json = await res.json().catch(() => null);
                setResponseBody(json ?? { status: res.status });
                if (!res.ok) {
                  const msg = json?.error || `Server returned ${res.status}`;
                  setStatusMessage(`Save failed: ${msg}`);
                  console.error('AddSessionPageClient: save failed', json || res.status);
                  setSaving(false);
                  return;
                }
                // success
                setStatusMessage('Saved successfully.');
                setTimeout(() => setStatusMessage(null), 3000);
                try {
                  setStep(1);
                  if (returnTo) router.push(returnTo);
                  else router.back();
                } catch (e) { router.push(returnTo || '/'); }
              } catch (e:any) {
                setStatusMessage(`Save error: ${e?.message ?? String(e)}`);
                console.error('AddSessionPageClient: save error', e);
              } finally {
                setSaving(false);
              }
            }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save'}</button>
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
