import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  // eslint-disable-next-line no-console
  console.warn('Supabase service role or url not set for admin coach-requests API');
}

const admin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE || '');

export async function GET() {
  try {
    const { data, error } = await admin
      .from('coach_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data || []) as any[];

    // Prefer stored first/last name (persisted at request time). If missing, try to enrich from auth.users
    const enriched = await Promise.all(rows.map(async (r) => {
      try {
        if (r.first_name || r.last_name) {
          const nm = `${r.first_name ?? ''}`.trim() + (r.last_name ? ` ${r.last_name}` : '');
          return { ...r, requester_name: nm.trim() || null };
        }
        if (!r.requester_id) return { ...r, requester_name: null };
        const { data: udata, error: uerr } = await admin
          .from('auth.users')
          .select('id, email, user_metadata')
          .eq('id', r.requester_id)
          .limit(1);
        if (uerr) return { ...r, requester_name: null };
        const user = (udata && udata.length) ? udata[0] : null;
        const full = user?.user_metadata?.full_name ?? null;
        return { ...r, requester_name: full };
      } catch (e) {
        return { ...r, requester_name: null };
      }
    }));

    return NextResponse.json({ requests: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
