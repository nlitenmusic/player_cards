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
    const clinic_id = url.searchParams.get('clinic_id');
    const player_id = url.searchParams.get('player_id');
    if (!clinic_id || !player_id) return NextResponse.json({ error: 'missing clinic_id or player_id' }, { status: 400 });

    const { data, error } = await supabaseServer.from('clinic_player_notes').select('note').eq('clinic_id', clinic_id).eq('player_id', player_id).limit(1);
    if (error) {
      console.error('clinic-player-notes GET supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const note = Array.isArray(data) && data.length ? data[0].note : null;
    return NextResponse.json({ note });
  } catch (err: any) {
    console.error('clinic-player-notes GET unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const clinic_id = body?.clinic_id;
    const player_id = body?.player_id;
    const note = typeof body?.note === 'string' ? body.note : null;
    if (!clinic_id || !player_id) return NextResponse.json({ error: 'missing clinic_id or player_id' }, { status: 400 });

    const upsertObj: any = { clinic_id, player_id, note };
    const { data, error } = await supabaseServer.from('clinic_player_notes').upsert([upsertObj], { onConflict: 'clinic_id,player_id' }).select().limit(1);
    if (error) {
      console.error('clinic-player-notes upsert supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ saved: Array.isArray(data) && data.length ? data[0] : null });
  } catch (err: any) {
    console.error('clinic-player-notes POST unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
