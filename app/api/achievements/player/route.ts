import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pid = url.searchParams.get('player_id');
    if (!pid) return NextResponse.json({ error: 'player_id required' }, { status: 400 });

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const supabase = require('@supabase/supabase-js').createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase
      .from('player_achievements')
      .select('id, awarded_at, metadata, achievements(id, key, name, description, icon_url)')
      .eq('player_id', pid)
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Normalize response
    const rows = (data || []).map((r: any) => ({
      id: r.achievements?.id ?? null,
      key: r.achievements?.key ?? null,
      name: r.achievements?.name ?? null,
      description: r.achievements?.description ?? null,
      icon_url: r.achievements?.icon_url ?? null,
      awarded_at: r.player_achievements?.awarded_at ?? null,
    }));

    return NextResponse.json({ achievements: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
