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
    const skills = Array.isArray(body?.skills) ? body.skills : null;
    if (!clinic_id || !skills) return NextResponse.json({ error: 'missing clinic_id or skills' }, { status: 400 });

    // delete existing skills for clinic
    const { error: delErr } = await supabaseServer.from('clinic_skills').delete().eq('clinic_id', clinic_id);
    if (delErr) {
      console.error('clinic-skills delete supabase error', delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    const rows = skills.map((s: any) => ({ clinic_id, skill: String(s) }));
    if (rows.length === 0) return NextResponse.json({ skills: [] });

    const { data, error } = await supabaseServer.from('clinic_skills').insert(rows).select();
    if (error) {
      console.error('clinic-skills insert supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ skills: data || [] });
  } catch (err: any) {
    console.error('clinic-skills POST unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
