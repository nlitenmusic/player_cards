import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for server API");
  throw new Error('Missing SUPABASE env vars for server API. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE are set on the server.');
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
      const diagnostics = {
        message: (error as any)?.message || String(error),
        details: (error as any)?.details || null,
        hint: (error as any)?.hint || null,
        code: (error as any)?.code || null,
      };
      let advice: string | null = null;
      const msg = (diagnostics.message || '').toLowerCase();
      if (msg.includes('row-level security') || msg.includes('rls') || (diagnostics.details || '').toLowerCase().includes('row-level security')) {
        advice = 'Row-level security (RLS) prevented this write. Possible fixes: (1) use a Supabase service role key on the server, (2) update RLS policies to allow this operation for the authenticated user, or (3) perform the write as a privileged server operation. Verify SUPABASE_SERVICE_ROLE is the service role secret.';
      }
      return NextResponse.json({ error: diagnostics.message, diagnostics, advice }, { status: 500 });
    }
    return NextResponse.json({ saved: Array.isArray(data) && data.length ? data[0] : null });
  } catch (err: any) {
    console.error('clinic-player-skills POST unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
