import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import recalibratePlayer from "../../../lib/recalibrate";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for server API");
}

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { player_id, mode } = body as { player_id?: string; mode?: string };

    if (!player_id) return NextResponse.json({ error: "player_id required" }, { status: 400 });
    if (mode !== "test" && mode !== "production") return NextResponse.json({ error: "invalid mode" }, { status: 400 });

    const result = await recalibratePlayer(supabaseServer as any, String(player_id), mode as any, "admin-api");

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("recalibrate unexpected error", err);
    // PostgREST / Supabase common error when table isn't present in schema cache
    if (err && (err.code === 'PGRST205' || (err?.message || '').includes("Could not find the table 'public.test_sessions'"))) {
      return NextResponse.json({ error: "Missing test tables in Supabase. Run db/migrations/001_create_test_tables.sql in your Supabase SQL editor." }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message ?? "unexpected" }, { status: 500 });
  }
}
