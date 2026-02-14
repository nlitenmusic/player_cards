import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE env vars for server API');
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const user_id = body?.user_id;
    const profile_type = body?.profile_type;
    const display_name = body?.display_name ?? null;

    if (!user_id || !profile_type) return NextResponse.json({ error: 'user_id and profile_type required' }, { status: 400 });

    if (profile_type === 'coach') {
      // insert coach profile (idempotent)
      const { data, error } = await admin.from('coaches').upsert([{ user_id, display_name }], { onConflict: 'user_id' }).select().limit(1);
      if (error) {
        console.error('create-profile (coach) error', error);
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
      }
      // set a role cookie so client and middleware can detect coach access
      return NextResponse.json({ ok: true, coach: Array.isArray(data) && data.length ? data[0] : data }, {
        headers: { 'Set-Cookie': 'pc_role=coach; Path=/; Max-Age=604800' }
      });
    }

    // For player profile creation we currently don't create a full player card automatically.
    // Return success so onboarding can continue; player cards are typically created by admins or via the add-player flow.
    // set a role cookie for player onboarding
    return NextResponse.json({ ok: true, message: 'player profile acknowledged' }, {
      headers: { 'Set-Cookie': 'pc_role=player; Path=/; Max-Age=604800' }
    });
  } catch (err: any) {
    console.error('create-profile unexpected', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
