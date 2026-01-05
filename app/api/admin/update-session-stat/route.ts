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
    const body = await req.json();
    const session_id = body.session_id;
    const skill_type = String(body.skill_type || "").trim();
    if (!session_id || !skill_type) {
      return NextResponse.json({ error: 'session_id and skill_type required' }, { status: 400 });
    }

    function toNullableNum(v: any) {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    }

    const row = {
      session_id,
      skill_type,
      c: toNullableNum(body.c),
      p: toNullableNum(body.p),
      a: toNullableNum(body.a),
      s: toNullableNum(body.s),
      t: toNullableNum(body.t),
    };

    // Validate session exists to avoid FK violation when inserting
    const { data: existingSession, error: sessErr } = await supabaseServer.from('sessions').select('id').eq('id', row.session_id).maybeSingle();
    if (sessErr) {
      console.error('update-session-stat session lookup error', sessErr);
      return NextResponse.json({ error: sessErr.message }, { status: 500 });
    }
    if (!existingSession) {
      return NextResponse.json({ error: `session not found: ${row.session_id}` }, { status: 400 });
    }

    // Try update first (no DB unique constraint required). If no rows updated, insert.
    const { data: updatedData, error: updateErr } = await supabaseServer
      .from('session_stats')
      .update({ c: row.c, p: row.p, a: row.a, s: row.s, t: row.t })
      .match({ session_id: row.session_id, skill_type: row.skill_type })
      .select();

    if (updateErr) {
      console.error('update-session-stat update error', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    if (Array.isArray(updatedData) && updatedData.length > 0) {
      return NextResponse.json({ updated: updatedData });
    }

    // No existing row — insert new
    const { data: insertedData, error: insertErr } = await supabaseServer.from('session_stats').insert([row]).select();
    if (insertErr) {
      console.error('update-session-stat insert error', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ updated: insertedData });
  } catch (err) {
    console.error('update-session-stat unexpected error', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
