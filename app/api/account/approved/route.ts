import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const admin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requesterId = body?.requester_id;
    if (!requesterId) return NextResponse.json({ error: 'requester_id required' }, { status: 400 });

    const { data, error } = await admin.from('players').select('id, first_name, last_name, avatar_url').eq('supabase_user_id', requesterId);
    if (error) return NextResponse.json({ error: error.message || error }, { status: 500 });
    return NextResponse.json({ players: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
