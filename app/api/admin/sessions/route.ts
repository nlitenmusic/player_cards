import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for server API");
}

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';

    // select sessions with player info and session_stats
    let builder = supabaseServer
      .from('sessions')
      .select('id, player_id, session_date, notes, players(id, first_name, last_name), session_stats(id, skill_type, c, p, a, s, t)')
      .order('session_date', { ascending: false });

    if (q) {
      const like = `%${q}%`;
      builder = builder.or(`players.first_name.ilike.${like},players.last_name.ilike.${like},notes.ilike.${like}`);
    }

    const { data, error } = await builder;
    if (error) {
      console.error('sessions list supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (err) {
    console.error('sessions list unexpected error', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
