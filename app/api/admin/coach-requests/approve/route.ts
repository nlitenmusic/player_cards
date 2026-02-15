import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = body?.request_id;
    if (!requestId) return NextResponse.json({ error: 'request_id required' }, { status: 400 });

    // fetch the coach request
    const { data: reqRow, error: fetchErr } = await admin.from('coach_requests').select('*').eq('id', requestId).limit(1).maybeSingle();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!reqRow) return NextResponse.json({ error: 'coach request not found' }, { status: 404 });

    const requesterId = reqRow.requester_id;
    const requesterEmail = reqRow.requester_email || null;
    const firstName = reqRow.first_name || null;
    const lastName = reqRow.last_name || null;

    // derive a friendly display name when possible
    const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : (requesterEmail ? requesterEmail.split('@')[0] : null);

    // create or upsert a coach profile for this user, include email column
    const payload: any = { user_id: requesterId, display_name: displayName, email: requesterEmail };
    const { data: coachData, error: coachErr } = await admin.from('coaches').upsert([payload], { onConflict: 'user_id' }).select().limit(1);
    if (coachErr) return NextResponse.json({ error: coachErr.message }, { status: 500 });

    // mark request as approved
    const { error: updateReqErr } = await admin.from('coach_requests').update({ status: 'approved' }).eq('id', requestId);
    if (updateReqErr) return NextResponse.json({ error: updateReqErr.message }, { status: 500 });

    const origin = new URL(req.url).origin || process.env.NEXT_PUBLIC_PRODUCTION_ORIGIN || '';
    const setRoleUrl = origin + '/api/account/set-role?role=coach';
    return NextResponse.json({ ok: true, coach: (coachData && coachData[0]) || null, set_role_url: setRoleUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
