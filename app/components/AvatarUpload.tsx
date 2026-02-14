'use client';
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AvatarUpload({ playerId, currentAvatar, onUploaded }: { playerId: number | string; currentAvatar?: string | null; onUploaded?: (url: string)=>void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string| null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error('You must be signed in to upload an avatar');
      const uid = user.id;
      const filePath = `${uid}/${Date.now()}_${file.name}`;

      const { data: upData, error: upError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      console.log('storage.upload result', { upData, upError });
      if (upError) {
        throw new Error(JSON.stringify(upError));
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = (urlData as any)?.publicUrl ?? '';
      if (!avatarUrl) throw new Error('failed to get public url');

      // persist to players table via server API
      const res = await fetch('/api/players/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, avatar_url: avatarUrl }),
      });
      // read raw body for non-JSON errors and try to parse
      const raw = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
      console.log('avatar save response', res.status, { raw, parsed });
      if (!res.ok) {
        throw new Error(JSON.stringify({ status: res.status, body: parsed ?? raw }));
      }

      if (typeof onUploaded === 'function') onUploaded(avatarUrl);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }} title="Change avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      {uploading ? <div style={{ fontSize: 12 }}>Uploading…</div> : null}
      {error ? <div style={{ color: 'red', fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}
