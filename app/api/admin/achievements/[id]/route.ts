import { NextResponse } from 'next/server';

function getIdFromReq(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // last segment should be the id
  return parts[parts.length - 1];
}

export async function PUT(req: Request) {
  try {
    const id = getIdFromReq(req);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await req.json();
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const supabase = require('@supabase/supabase-js').createClient(SUPABASE_URL, SERVICE_ROLE);
    const payload: any = {};
    if (body.key !== undefined) payload.key = body.key;
    if (body.name !== undefined) payload.name = body.name;
    if (body.description !== undefined) payload.description = body.description;
    if (body.icon_url !== undefined) payload.icon_url = body.icon_url;
    if (body.rule_type !== undefined) payload.rule_type = body.rule_type;
    if (body.rule_payload !== undefined) payload.rule_payload = body.rule_payload;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('achievements').update(payload).eq('id', id).select('*').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ achievement: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = getIdFromReq(req);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const supabase = require('@supabase/supabase-js').createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error } = await supabase.from('achievements').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: 'deleted', id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
