"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminClaimsPage() {
  const [requests, setRequests] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/claim-requests');
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed to load');
      setRequests(j.requests || []);
    } catch (e) {
      console.error(e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    try {
      const res = await fetch('/api/admin/claim-requests/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ request_id: id }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed');
      alert('Approved');
      load();
    } catch (e:any) {
      console.error(e);
      alert(e?.message || 'Failed');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Pending Claim Requests</h2>
        <div><Link href="/">Home</Link></div>
      </div>

      <div style={{ maxWidth: 980, margin: '18px auto' }}>
        {loading ? <div>Loading…</div> : null}
        {requests && requests.length === 0 ? <div>No pending requests.</div> : null}
        <div style={{ display: 'grid', gap: 12 }}>
          {requests?.map((r:any) => (
            <div key={r.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.requester_email || r.requester_id}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Player: {r.player ? `${r.player.first_name || ''} ${r.player.last_name || ''}`.trim() : r.player_id} — requested: {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={()=>approve(r.id)} style={{ padding: '6px 10px' }}>Approve</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
