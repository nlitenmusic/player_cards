"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CoachClaimsPage() {
  const [requests, setRequests] = useState<any[] | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch (e) {}
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; (sub as any)?.subscription?.unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!user) { setRequests(null); return; }
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('claim_requests').select('*').eq('requester_id', user.id).order('created_at', { ascending: false });
        if (!mounted) return;
        if (error) { setRequests([]); return; }
        setRequests(data || []);
      } catch (e) { if (mounted) setRequests([]); }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (!user) return (
    <div style={{ padding: 20 }}>Sign in to view your requests.</div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Your access requests</h2>
      {requests === null ? <div>Loading…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {requests.length === 0 ? <div style={{ color: '#6b7280' }}>No requests yet.</div> : requests.map((r:any) => (
            <div key={r.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
              <div><strong>Player:</strong> {String(r.player_id)}</div>
              <div><strong>Status:</strong> {r.status}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(r.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
