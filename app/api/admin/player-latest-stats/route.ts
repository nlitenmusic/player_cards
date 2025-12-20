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
    if (!player_id) return NextResponse.json({ error: "missing player_id" }, { status: 400 });

    // find latest session for player
    const { data: sessions } = await supabaseServer
      .from("sessions")
      .select("id,session_date")
      .eq("player_id", player_id)
      .order("session_date", { ascending: false })
      .limit(1);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ stats: [] });
    }

    const sessionId = sessions[0].id;
    const sessionDate = sessions[0].session_date;

    const { data: stats } = await supabaseServer
      .from("session_stats")
      .select("skill_type,c,p,a,s,t")
      .eq("session_id", sessionId);

    return NextResponse.json({ stats: stats ?? [], session_date: sessionDate });
  } catch (err) {
    console.error("player-latest-stats error", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}