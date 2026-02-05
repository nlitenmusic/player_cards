"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { (sub as any)?.subscription?.unsubscribe?.(); };
  }, []);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;
      const { data, error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
      setMessage('Magic link sent — check your email and follow the link to sign in.');
    } catch (err: any) {
      setMessage(err.message ?? String(err));
    } finally { setLoading(false); }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setMessage(null);
      const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
      // Supabase will redirect the browser; still show a message in case redirect is blocked
      setMessage('Opening Google sign-in...');
    } catch (err: any) {
      setMessage(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setMessage('Signed out');
  }

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 13 }}>{user.email}</div>
        <button onClick={handleSignOut} style={{ padding: '6px 8px' }}>Sign out</button>
        {message ? <div style={{ fontSize: 12, color: '#6b7280' }}>{message}</div> : null}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <form onSubmit={handleMagicLink} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email" style={{ padding: 6 }} />
        <button type="submit" disabled={loading || !email} style={{ padding: '6px 8px' }}>Send sign-in link</button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={handleGoogleSignIn} disabled={loading} style={{ padding: '6px 8px' }}>Sign in with Google</button>
      </div>

      {message ? <div style={{ fontSize: 12, color: '#6b7280', width: '100%' }}>{message}</div> : null}
    </div>
  );
}
