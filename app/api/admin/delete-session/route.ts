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
    const { session_id } = body as { session_id: string };
    if (!session_id) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

    // delete dependent session_stats first, then the session row
    const { error: statsErr } = await supabaseServer.from("session_stats").delete().eq("session_id", session_id);
    if (statsErr) {
      console.error('delete-session: failed to delete session_stats', statsErr);
      return NextResponse.json({ error: statsErr.message || 'failed to delete session_stats' }, { status: 500 });
    }

    const { error: sessErr } = await supabaseServer.from("sessions").delete().eq("id", session_id);
    if (sessErr) {
      console.error('delete-session: failed to delete session', sessErr);
      return NextResponse.json({ error: sessErr.message || 'failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('delete-session unexpected error', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
