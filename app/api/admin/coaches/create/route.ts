import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE env vars for admin coaches create API');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, display_name, bio, email } = body || {};
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const payload: any = { user_id, display_name: display_name ?? null, bio: bio ?? null };
    if (email) payload.email = email;
    // upsert so creating again for same user_id is idempotent
    const { data, error } = await admin.from('coaches').upsert([payload], { onConflict: 'user_id' }).select().limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, coach: (data && data[0]) || null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
