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
    const { player_id, session_date, stats_components, notes } = body as {
      player_id: string;
      session_date: string;
      stats_components: any[];
      notes?: string;
    };

    if (!player_id || !Array.isArray(stats_components) || stats_components.length !== 7) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    // validate numbers
    const ok = stats_components.every((r) => typeof r.skill_type === "string");
    if (!ok) return NextResponse.json({ error: "invalid stats components" }, { status: 400 });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(session_date))) {
      return NextResponse.json({ error: "invalid date" }, { status: 400 });
    }

    // insert session
    const { data: sessionData, error: sessionErr } = await supabaseServer
      .from("sessions")
      .insert({ player_id, session_date, notes: notes ?? null })
      .select("id")
      .single();

    if (sessionErr || !sessionData) {
      console.error("session insert error", sessionErr);
      return NextResponse.json({ error: sessionErr?.message || "failed to insert session" }, { status: 500 });
    }

    const session_id = (sessionData as any).id;

    // build session_stats rows with components c/p/a/s/t
    const validSkills = ["serve","return","forehand","backhand","volley","overhead","movement"];
    function toNumOrZero(v: any) {
      if (v == null) return 0;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }

    const statsRows = stats_components.map((r: any) => {
      const skill = String(r.skill_type ?? "").trim();
      const key = skill.toLowerCase();
      if (!validSkills.includes(key)) {
        console.warn("Unexpected skill_type on create-session:", skill);
      }
      return {
        session_id,
        player_id,
        skill_type: skill,
        c: toNumOrZero(r.c),
        p: toNumOrZero(r.p),
        a: toNumOrZero(r.a),
        s: toNumOrZero(r.s),
        t: toNumOrZero(r.t),
      };
    });

    // Build an insert payload that matches the DB schema (omit extraneous fields)
    const insertRows = statsRows.map((r: any) => ({
      session_id: r.session_id,
      skill_type: r.skill_type,
      c: r.c,
      p: r.p,
      a: r.a,
      s: r.s,
      t: r.t,
    }));

    // sanitize against authoritative schema to guard against unexpected fields
    const cleanRows = sanitizeRows('session_stats', insertRows);

    try {
      console.debug('create-session: inserting session_stats sample', JSON.stringify(cleanRows[0] ?? {}, null, 2));
      const { error: statsErr } = await supabaseServer.from("session_stats").insert(cleanRows);
      if (statsErr) throw statsErr;
    } catch (statsErr: any) {
      console.error("session_stats insert error", {
        message: statsErr?.message,
        details: statsErr?.details,
        hint: statsErr?.hint,
        code: statsErr?.code,
      });

      // attempt to rollback the session we just created to avoid orphan sessions
      try {
        await supabaseServer.from("sessions").delete().eq("id", session_id);
      } catch (delErr) {
        console.error("failed to rollback session after stats insert error", delErr);
      }

      return NextResponse.json({ error: statsErr?.message || 'session_stats insert failed' }, { status: 500 });
    }

    // optional: you can trigger any recompute/refresh logic here (e.g., call a DB function)
    return NextResponse.json({ ok: true, session_id });
  } catch (err) {
    console.error("create-session unexpected error", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}