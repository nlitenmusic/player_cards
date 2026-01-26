import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for server API");
}

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const clinic_id = body?.clinic_id;
    const player_id = body?.player_id;
    const action = body?.action;
    if (!clinic_id || !player_id || !action) return NextResponse.json({ error: 'missing clinic_id/player_id/action' }, { status: 400 });

    if (action === 'add') {
      const { data, error } = await supabaseServer.from('clinic_players').upsert([{ clinic_id, player_id }], { onConflict: 'clinic_id,player_id' }).select().limit(1);
      if (error) {
        console.error('clinic-players add supabase error', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ added: Array.isArray(data) && data.length ? data[0] : null });
    }

    if (action === 'remove') {
      const { error } = await supabaseServer.from('clinic_players').delete().eq('clinic_id', clinic_id).eq('player_id', player_id);
      if (error) {
        console.error('clinic-players remove supabase error', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ removed: true });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('clinic-players POST unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
