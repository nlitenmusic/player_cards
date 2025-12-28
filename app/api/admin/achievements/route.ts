import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const supabase = require('@supabase/supabase-js').createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase.from('achievements').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ achievements: data || [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const body = await req.json();
    const key = String(body.key || '').trim();
    const name = String(body.name || '').trim();
    const description = body.description ?? null;
    const icon_url = body.icon_url ?? null;
    const rule_type = String(body.rule_type || 'top_by_skill');
    const rule_payload = body.rule_payload || null;

    if (!key || !name) return NextResponse.json({ error: 'key and name are required' }, { status: 400 });

    const supabase = require('@supabase/supabase-js').createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase.from('achievements').insert([{ key, name, description, icon_url, rule_type, rule_payload }]).select('*').single();
    if (error) {
      const msg = String(error.message || error);
      if (msg.toLowerCase().includes('duplicate key') || msg.includes('unique constraint')) {
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ achievement: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
