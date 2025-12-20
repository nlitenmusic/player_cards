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
    const { session_id, session_date, stats_components, notes } = body as {
      session_id: string;
      session_date: string;
      stats_components: any[];
      notes?: string;
    };
    if (!session_id) return NextResponse.json({ error: "missing session_id" }, { status: 400 });
    if (!/\d{4}-\d{2}-\d{2}/.test(String(session_date))) return NextResponse.json({ error: "invalid date" }, { status: 400 });

    // update session row
    const { error: sessErr } = await supabaseServer.from("sessions").update({ session_date, notes: notes ?? null }).eq("id", session_id);
    if (sessErr) {
      console.error('update-session: failed to update session', sessErr);
      return NextResponse.json({ error: sessErr.message || 'failed to update session' }, { status: 500 });
    }

    // replace session_stats: delete old ones, insert new
    const { error: delErr } = await supabaseServer.from("session_stats").delete().eq("session_id", session_id);
    if (delErr) {
      console.error('update-session: failed to delete old session_stats', delErr);
      return NextResponse.json({ error: delErr.message || 'failed to delete old session_stats' }, { status: 500 });
    }

    const insertRows = (stats_components || []).map((r: any) => ({
      session_id,
      skill_type: String(r.skill_type ?? "").trim(),
      c: r.c ?? null,
      p: r.p ?? null,
      a: r.a ?? null,
      s: r.s ?? null,
      t: r.t ?? null,
    }));

    const cleanRows = sanitizeRows('session_stats', insertRows);

    if (cleanRows.length) {
      const { error: insErr } = await supabaseServer.from("session_stats").insert(cleanRows);
      if (insErr) {
        console.error('update-session: failed to insert session_stats', insErr);
        return NextResponse.json({ error: insErr.message || 'failed to insert session_stats' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('update-session unexpected error', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
