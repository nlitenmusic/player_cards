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

    // players owned directly by this requester
    const { data: owned, error: ownedErr } = await admin.from('players').select('id, first_name, last_name, avatar_url').eq('supabase_user_id', requesterId);
    if (ownedErr) return NextResponse.json({ error: ownedErr.message || ownedErr }, { status: 500 });

    // players granted via player_access
    const { data: accessRows, error: accessErr } = await admin.from('player_access').select('player_id').eq('user_id', requesterId);
    if (accessErr) return NextResponse.json({ error: accessErr.message || accessErr }, { status: 500 });

    const accessPlayerIds = (accessRows || []).map((r: any) => r.player_id).filter(Boolean);
    let accessedPlayers: any[] = [];
    if (accessPlayerIds.length > 0) {
      const { data: ap, error: apErr } = await admin.from('players').select('id, first_name, last_name, avatar_url').in('id', accessPlayerIds);
      if (apErr) return NextResponse.json({ error: apErr.message || apErr }, { status: 500 });
      accessedPlayers = ap || [];
    }

    // merge unique players (owned + accessed)
    const merged: any[] = [];
    const seen = new Set<string|number>();
    for (const p of (owned || [])) {
      if (!p) continue;
      seen.add(p.id);
      merged.push(p);
    }
    for (const p of accessedPlayers) {
      if (!p) continue;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      merged.push(p);
    }

    return NextResponse.json({ players: merged });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
