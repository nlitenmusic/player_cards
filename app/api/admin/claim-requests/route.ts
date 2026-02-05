import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  // eslint-disable-next-line no-console
  console.warn('Supabase service role or url not set for admin claim-requests API');
}

const admin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE || '');

export async function GET() {
  try {
    const { data, error } = await admin
      .from('claim_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // fetch player names for the requested player_ids and merge
    const playerIds = Array.from(new Set((data || []).map((r: any) => r.player_id).filter(Boolean)));
    let playersMap: Record<string, any> = {};
    if (playerIds.length > 0) {
      const { data: playersData, error: pErr } = await admin.from('players').select('id, first_name, last_name').in('id', playerIds);
      if (!pErr && playersData) {
        for (const p of playersData) playersMap[String(p.id)] = p;
      }
    }

    const merged = (data || []).map((r: any) => ({ ...r, player: playersMap[String(r.player_id)] || null }));
    return NextResponse.json({ requests: merged });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
