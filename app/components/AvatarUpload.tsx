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

      const { error: upError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (upError) throw upError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = (urlData as any)?.publicUrl ?? '';
      if (!avatarUrl) throw new Error('failed to get public url');

      // persist to players table via server API
      const res = await fetch('/api/players/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, avatar_url: avatarUrl }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'failed to save avatar');

      if (typeof onUploaded === 'function') onUploaded(avatarUrl);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ cursor: 'pointer', fontSize: 12, color: '#0b69ff' }}>
        {uploading ? 'Uploading...' : 'Change avatar'}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      {error ? <div style={{ color: 'red', fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}
