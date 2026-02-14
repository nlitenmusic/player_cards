import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeRows } from "../../../lib/dbSchema";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for server API");
}

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, requester_id } = body as { first_name?: string; last_name?: string; requester_id?: string };
    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'first_name and last_name required' }, { status: 400 });
    }

    const insert = sanitizeRows('players', [{ first_name, last_name }]);
    const { data, error } = await supabaseServer.from('players').insert(insert).select('id, first_name, last_name').single();
    if (error || !data) {
      console.error('create-player error', error);
      return NextResponse.json({ error: error?.message || 'failed to create player' }, { status: 500 });
    }

    // if a requester_id was provided, also grant access via player_access
    if (requester_id) {
      try {
        const { error: accessErr } = await supabaseServer.from('player_access').insert({ user_id: requester_id, player_id: (data as any).id });
        if (accessErr) {
          console.error('create-player: failed to insert player_access', accessErr);
        }
      } catch (e) {
        console.error('create-player: unexpected player_access insert error', e);
      }
    }

    return NextResponse.json({ ok: true, player: data });
  } catch (err) {
    console.error('create-player unexpected', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
