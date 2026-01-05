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
    const { session_id, notes } = body as { session_id?: string; notes?: string | null };
    if (!session_id) return NextResponse.json({ error: 'missing session_id' }, { status: 400 });

    const { error } = await supabaseServer.from('sessions').update({ notes: notes ?? null }).eq('id', session_id);
    if (error) {
      console.error('update-session-notes error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('update-session-notes unexpected', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
