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
    const player_id = url.searchParams.get("player_id");
    if (!player_id) return NextResponse.json({ error: "player_id required" }, { status: 400 });

    const { data, error } = await supabaseServer
      .from("sessions")
      .select("id, session_date, notes, session_stats(id, skill_type, c, p, a, s, t)")
      .eq("player_id", player_id)
      .order("session_date", { ascending: false });

    if (error) {
      console.error("player-sessions supabase error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize session_date to date-only (YYYY-MM-DD) to avoid timezone conversion on the client
    const sessions = (data || []).map((r: any) => ({
      ...r,
      session_date: r?.session_date ? String(r.session_date).slice(0, 10) : r?.session_date,
    }));

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("player-sessions unexpected error", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}
