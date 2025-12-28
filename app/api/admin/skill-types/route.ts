import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const supabase = require('@supabase/supabase-js').createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data, error } = await supabase.from('session_stats').select('skill_type').limit(100000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const set = new Set<string>();
    for (const row of (data || [])) {
      if (row && row.skill_type) set.add(String(row.skill_type));
    }
    const skills = Array.from(set).sort((a,b)=>a.localeCompare(b));
    return NextResponse.json({ skills });
  } catch (err:any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
