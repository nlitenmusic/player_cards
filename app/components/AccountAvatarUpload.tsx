"use client";
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AccountAvatarUpload({ onUpdated }: { onUpdated?: (url: string)=>void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error('Please sign in');
      const uid = user.id;
      const filePath = `users/${uid}/${Date.now()}_${file.name}`;

      const { data: upData, error: upError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (upError) throw upError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = (urlData as any)?.publicUrl ?? '';
      if (!avatarUrl) throw new Error('Failed to get public URL');

      // Update user metadata so header/avatar buttons reflect change
      const { data: updated, error: updErr } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      if (updErr) throw updErr;

      if (typeof onUpdated === 'function') onUpdated(avatarUrl);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }} title="Change account avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
