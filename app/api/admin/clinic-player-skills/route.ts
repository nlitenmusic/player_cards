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
    const skill = body?.skill;
    const component = body?.component;
    const value = typeof body?.value !== 'undefined' ? body.value : null;
    if (!clinic_id || !player_id || !skill || !component) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

    const upsertObj: any = { clinic_id, player_id, skill: String(skill), component: String(component), value };
    const { data, error } = await supabaseServer.from('clinic_player_skills').upsert([upsertObj], { onConflict: 'clinic_id,player_id,skill,component' }).select().limit(1);
    if (error) {
      console.error('clinic-player-skills upsert supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ saved: Array.isArray(data) && data.length ? data[0] : null });
  } catch (err: any) {
    console.error('clinic-player-skills POST unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
