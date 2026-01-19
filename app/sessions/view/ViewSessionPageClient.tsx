"use client";

import React, { useEffect, useRef, useState } from "react";
import AddSessionForm from "../../components/AddSessionForm";

const AddSessionFormAny = AddSessionForm as any;

export default function ViewSessionPageClient({ playerId, initialSessionId }: { playerId?: string | null; initialSessionId?: string | null }) {
  const [step, setStep] = useState<number>(1);
  const [sessions, setSessions] = useState<any[] | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessionId ?? null);
  const [notes, setNotes] = useState<string>('');
  const [pendingSessionPayload, setPendingSessionPayload] = useState<any | null>(null);
  const formRef = useRef<any>(null);

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/player-sessions?player_id=${encodeURIComponent(String(playerId))}`);
        const j = await res.json();
        const list = j.sessions || j.data || [];
        console.debug('ViewSessionPageClient: fetched sessions', list);
        setSessions(Array.isArray(list) ? list : []);
        // auto-open if initialSessionId provided
        if (initialSessionId && Array.isArray(list)) {
          const found = list.find((s:any)=>String(s.id) === String(initialSessionId) || String(s.session_id) === String(initialSessionId));
          if (found) setSelectedSessionId(String(found.id ?? found.session_id ?? ''));
        }
      } catch (e) {
        setSessions([]);
      }
    })();
  }, [playerId, initialSessionId]);

  const reloadSessions = async () => {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/admin/player-sessions?player_id=${encodeURIComponent(String(playerId))}`);
      const j = await res.json();
      const list = j.sessions || j.data || [];
      setSessions(Array.isArray(list) ? list : []);
    } catch (e) {
      setSessions([]);
    }
  };

  useEffect(() => {
    if (selectedSessionId) setStep(2);
  }, [selectedSessionId]);

  // If we have a pending payload (created by clicking a session before the
  // form mounted), apply it when the detail step is active and the form is ready.
  useEffect(() => {
    try {
      if (step !== 2 || !pendingSessionPayload) return;
      const frm = formRef.current;
      if (frm && typeof frm.setState === 'function') {
        frm.setState(pendingSessionPayload);
        setPendingSessionPayload(null);
      }
    } catch (e) {}
  }, [step, pendingSessionPayload]);

  // If the form ref becomes available after selectedSessionId was set,
  // ensure we call setState on the ref to load the session.
  useEffect(() => {
    try {
      const frm = formRef.current;
      if (!frm || !selectedSessionId) return;
      if (typeof frm.setState === 'function') frm.setState({ selectedSessionId });
    } catch (e) {}
  }, [formRef, selectedSessionId]);

  // When a session is selected, instruct the AddSessionForm (via ref)
  // to load that session's data. AddSessionForm exposes setState({ selectedSessionId })
  // which will call its internal loadSessionById.
  useEffect(() => {
    try {
      if (!selectedSessionId) return;
      const frm = formRef.current;
      if (frm && typeof frm.setState === 'function') {
        frm.setState?.({ selectedSessionId: selectedSessionId });
      }
    } catch (e) {
      // ignore
    }
  }, [selectedSessionId]);

  const StepList = () => {
    return (
      <div style={{ width: 393, height: 852, background: 'var(--card-bg)', padding: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ transform: 'translateY(48px)', willChange: 'transform' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Sessions</div>
            <a href="/admin" style={{ fontSize: 12, color: 'var(--muted)' }}>Close</a>
          </div>

          <div style={{ marginTop: 12, overflowY: 'auto', flexGrow: 1 }}>
          {sessions === null ? (
            <div>Loading…</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>No sessions found for this player.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((s:any, idx:number) => {
                const sid = s.id ?? s.session_id ?? s.sessionId ?? idx;
                  // prefer the session_date returned by the API (already normalized to YYYY-MM-DD)
                  const label = s.session_date ? String(s.session_date).slice(0,10) : (`Session ${idx+1}`);
                const computeRowsFromSession = (sess: any) => {
                  const skillLabels = ["Serve", "Return", "Forehand", "Backhand", "Volley", "Overhead", "Movement"];
                  const rows = skillLabels.map((label) => ({ skill_type: label, c: null, p: null, a: null, s: null, t: null }));
                  const map: Record<string, any> = {};
                  for (const r of (sess.session_stats || [])) {
                    const key = String(r.skill_type || '').trim().toLowerCase();
                    map[key] = r;
                  }
                  return rows.map((row: any) => {
                    const k = String(row.skill_type || '').toLowerCase();
                    const rr = map[k];
                    return { skill_type: row.skill_type, c: rr?.c ?? null, p: rr?.p ?? null, a: rr?.a ?? null, s: rr?.s ?? null, t: rr?.t ?? null };
                  });
                };

                return (
                  <button key={String(sid) + '-' + idx} onClick={() => {
                    const payload = {
                      rows: computeRowsFromSession(s),
                      date: s.session_date ? String(s.session_date).slice(0,10) : undefined,
                      notes: s.notes ? String(s.notes) : undefined,
                      selectedSessionId: String(sid),
                    };
                    setPendingSessionPayload(payload);
                    try {
                      const frm = formRef.current;
                      if (frm && typeof frm.setState === 'function') {
                        frm.setState(payload);
                        setPendingSessionPayload(null);
                      }
                    } catch (e) {}
                    setSelectedSessionId(String(sid));
                  }} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--card-fg)', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                    {s.notes ? <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, maxHeight: 36, overflow: 'hidden' }}>{String(s.notes).slice(0, 140)}</div> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    );
  };

  const StepDetail = () => {
    return (
      <div style={{ width: 393, height: 852, background: 'var(--card-bg)', padding: 8, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ transform: 'translateY(48px)', willChange: 'transform' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Session detail</div>
          </div>

          <div style={{ marginTop: 0, flexGrow: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <div style={{ width: 369 }}>
              <AddSessionFormAny
                ref={formRef}
                player={{ id: playerId }}
                sessionId={selectedSessionId}
                hideDate
                hideNotes
                hideDelete={false}
                showSaveButton={true}
                navSlot={(
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                    <div>
                      <button className="text-btn" onClick={() => setStep(1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)' }}>Back</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="text-btn" onClick={() => {
                        try {
                          const s = formRef.current?.getState?.();
                          setNotes(s?.notes ?? '');
                        } catch (e) { setNotes(''); }
                        setStep(3);
                      }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Notes</button>
                      <button className="text-btn" onClick={async () => {
                        try {
                          await formRef.current?.submit?.();
                        } catch (e) { console.error(e); }
                      }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Save</button>
                    </div>
                  </div>
                )}
                onCreated={async () => { await reloadSessions(); setStep(1); }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StepNotes = () => {
    const [editing, setEditing] = useState<boolean>(false);
    const [localNotes, setLocalNotes] = useState<string>(notes || '');

    useEffect(() => { setLocalNotes(notes || ''); }, [notes]);

    const saveNotes = async () => {
      if (!selectedSessionId) return;
      try {
        await fetch('/api/admin/update-session-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: selectedSessionId, notes: localNotes }),
        });
        setNotes(localNotes);
        setEditing(false);
        setStep(2);
      } catch (e) {
        console.error('Failed to save notes', e);
      }
    };

    return (
      <div style={{ width: 393, height: 852, background: 'var(--card-bg)', padding: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ transform: 'translateY(48px)', willChange: 'transform' }}>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <div style={{ width: 320 }}>
              <div style={{ width: 320, height: 22, fontFamily: 'Inter', fontSize: 16, lineHeight: '22px', color: 'var(--foreground)' }}>Notes</div>
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Notes (coach comments, background)"
                style={{ marginTop: 8, minHeight: 120, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--card-fg)', width: '100%', boxSizing: 'border-box', whiteSpace: 'pre-wrap' }}
                readOnly={!editing}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
            <div>
              <button className="text-btn" onClick={() => setStep(2)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)' }}>Back</button>
            </div>
            <div>
              {!editing ? (
                <>
                  <button className="text-btn" onClick={() => setEditing(true)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600, marginRight: 8 }}>Edit</button>
                  <button className="text-btn" onClick={() => setStep(1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Done</button>
                </>
              ) : (
                <>
                  <button className="text-btn" onClick={() => { setEditing(false); setLocalNotes(notes || ''); }} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--card-fg)', marginRight: 8 }}>Cancel</button>
                  <button className="text-btn" onClick={saveNotes} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }}>Save</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!playerId) return <div style={{ padding: 20 }}>Player not specified.</div>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 0, height: 852 }}>
      {step === 1 && <StepList />}
      {step === 2 && <StepDetail />}
      {step === 3 && <StepNotes />}
    </div>
  );
}
