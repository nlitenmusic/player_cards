'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ClaimButton({ playerId }: { playerId: number | string }) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id ?? null;
        console.debug('[ClaimButton] auth user id', uid, 'playerId', playerId);
        if (!uid) return;
        const { data, error } = await supabase
          .from('claim_requests')
          .select('id')
          .eq('player_id', playerId)
          .eq('requester_id', uid)
          .limit(1);
        if (error) {
          console.error('[ClaimButton] error fetching existing request', error);
        }
        console.debug('[ClaimButton] fetch result', { data, error });
        if (mounted && data && data.length) {
          setRequested(true);
          const rid = (data[0] as any)?.id ?? null;
          if (rid) setRequestId(String(rid));
        }
      } catch (e) {
        console.error('[ClaimButton] unexpected error', e);
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

      const { data: inserted, error } = await supabase.from('claim_requests').insert(payload).select('id').limit(1);
      if (error) throw error;
      setRequested(true);
      const rid = Array.isArray(inserted) && inserted.length ? (inserted[0] as any).id : null;
      if (rid) setRequestId(String(rid));
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setErr(null);
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error('Not signed in');

      if (requestId) {
        const { error } = await supabase.from('claim_requests').delete().eq('id', requestId).eq('requester_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('claim_requests').delete().match({ player_id: String(playerId), requester_id: user.id });
        if (error) throw error;
      }

      setRequested(false);
      setRequestId(null);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  if (requested) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 12, color: '#0b69ff' }}>Request pending</div>
      <button onClick={handleCancel} disabled={loading} style={{ padding: '4px 8px', fontSize: 12 }}>
        {loading ? 'Cancelling…' : 'Cancel'}
      </button>
      {err ? <div style={{ color: 'red', fontSize: 12 }}>{err}</div> : null}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button onClick={handleRequest} disabled={loading} style={{ padding: '6px 8px', fontSize: 12 }}>
        {loading ? 'Requesting…' : 'Request access'}
      </button>
      {err ? <div style={{ color: 'red', fontSize: 12 }}>{err}</div> : null}
    </div>
  );
}
