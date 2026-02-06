import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  // eslint-disable-next-line no-console
  console.warn('Missing Supabase env vars for admin coaches API');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function GET() {
  try {
    const { data, error } = await admin.from('coaches').select('id, user_id, display_name, created_at').order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ coaches: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
