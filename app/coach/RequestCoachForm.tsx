"use client";
import React, { useState } from 'react';

export default function RequestCoachForm({ user, adminEmail = 'info.jordantolbert@gmail.com' }: { user: any, adminEmail?: string }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const payload = {
        requester_id: user.id,
        requester_email: user.email ?? null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        affiliation: affiliation.trim() || null,
      };

      const res = await fetch('/api/account/request-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Request failed');
      alert('Request submitted — an admin will review it.');
    } catch (err:any) {
      alert(err?.message || String(err));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minWidth: 320, maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 700 }}>Request Coach Access</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>Provide your name and where you teach so admins can verify your request.</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="First name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
        <input placeholder="Last name" value={lastName} onChange={(e)=>setLastName(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>
      <textarea placeholder="Where do you teach? (short message)" value={affiliation} onChange={(e)=>setAffiliation(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #e5e7eb', minHeight: 80 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={submit} disabled={loading || !firstName.trim() || !lastName.trim() || !affiliation.trim()} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{loading ? 'Submitting…' : 'Submit request'}</button>
        <a href={`mailto:${adminEmail}`} style={{ padding: '8px 12px', background: 'transparent', color: '#0b69ff', border: '1px solid #e6eefb', borderRadius: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Contact Admin</a>
      </div>
    </div>
  );
}
