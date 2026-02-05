'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ClaimButton({ playerId }: { playerId: number | string }) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id ?? null;
        if (!uid) return;
        const { data, error } = await supabase
          .from('claim_requests')
          .select('id')
          .eq('player_id', playerId)
          .eq('requester_id', uid)
          .limit(1);
        if (mounted && data && data.length) setRequested(true);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [playerId]);

  async function handleRequest() {
    setErr(null);
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error('Not signed in');

      const payload = {
        player_id: playerId,
        requester_id: user.id,
        requester_email: user.email ?? null,
        status: 'pending',
      } as any;

      const { error } = await supabase.from('claim_requests').insert(payload);
      if (error) throw error;
      setRequested(true);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  if (requested) return <div style={{ fontSize: 12, color: '#0b69ff' }}>Request sent</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button onClick={handleRequest} disabled={loading} style={{ padding: '6px 8px', fontSize: 12 }}>
        {loading ? 'Requesting…' : 'Request access'}
      </button>
      {err ? <div style={{ color: 'red', fontSize: 12 }}>{err}</div> : null}
    </div>
  );
}
