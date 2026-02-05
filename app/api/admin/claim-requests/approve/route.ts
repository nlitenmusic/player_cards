import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const admin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = body?.request_id;
    if (!requestId) return NextResponse.json({ error: 'request_id required' }, { status: 400 });

    // fetch the claim request
    const { data: reqRows, error: fetchErr } = await admin.from('claim_requests').select('*').eq('id', requestId).limit(1).maybeSingle();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!reqRows) return NextResponse.json({ error: 'claim request not found' }, { status: 404 });

    const playerId = reqRows.player_id;
    const requesterId = reqRows.requester_id;

    // grant access by inserting into player_access (allows multiple users per player)
    const upsertObj = { player_id: playerId, user_id: requesterId, granted_by: null };
    const { data: accessData, error: accessErr } = await admin.from('player_access').upsert([upsertObj], { onConflict: 'player_id,user_id' }).select().limit(1);
    if (accessErr) return NextResponse.json({ error: accessErr.message }, { status: 500 });

    // If the players.supabase_user_id is empty, set it to this requester (preserve existing owner if present)
    const { data: playerRow, error: playerFetchErr } = await admin.from('players').select('id, supabase_user_id').eq('id', playerId).limit(1).maybeSingle();
    if (playerFetchErr) return NextResponse.json({ error: playerFetchErr.message }, { status: 500 });
    if (playerRow && !playerRow.supabase_user_id) {
      const { error: updatePlayerErr } = await admin.from('players').update({ supabase_user_id: requesterId }).eq('id', playerId);
      if (updatePlayerErr) return NextResponse.json({ error: updatePlayerErr.message }, { status: 500 });
    }

    // mark claim request as approved
    const { error: updateReqErr } = await admin.from('claim_requests').update({ status: 'approved' }).eq('id', requestId);
    if (updateReqErr) return NextResponse.json({ error: updateReqErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, access: accessData?.[0] ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
