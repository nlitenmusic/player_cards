import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StatRow = {
  c?: number | string | null;
  p?: number | string | null;
  a?: number | string | null;
  s?: number | string | null;
  t?: number | string | null;
  skill_type?: string | null;
  [key: string]: unknown;
};

type Session = {
  id: number;
  player_id?: number;
  session_date?: string;
  session_stats?: StatRow[];
  staging_player_stats?: any;
};

type PlayerRaw = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  sessions?: Session[];
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for server API");
}

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function GET(): Promise<NextResponse> {
  try {
    // single safe select: DO NOT attempt to embed staging_player_stats to avoid PostgREST warning
    const { data, error } = await supabaseServer
      .from("players")
      .select(
        `id, first_name, last_name,
         sessions(id, player_id, session_date, session_stats(c,p,a,s,t,skill_type))`
      )
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Supabase server error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const players = (data || []) as PlayerRaw[];

    // canonical skill order expected by the frontend
    const SKILL_ORDER = [
      "serve",
      "return",
      "forehand",
      "backhand",
      "volley",
      "overhead",
      "movement",
    ];

    const out = players.map((p) => {
      const sessions = p.sessions || [];

      // Build buckets per skill and compute per-row averages in a normalized way
      const buckets: Record<string, number[]> = {};
      for (const s of sessions) {
        const rows: StatRow[] = s.session_stats || [];
        for (const r of rows) {
          const skillType = (r.skill_type ?? "").toString().trim().toLowerCase();

          // Special-case: Movement MUST use only the `t` component (per MCP rule)
          if (skillType === "movement") {
            const tv = toNumber((r as any).t);
            if (tv !== null) {
              if (!buckets[skillType]) buckets[skillType] = [];
              buckets[skillType].push(round2(tv));
            }
            continue; // skip generic averaging for movement
          }

          // compute this row's numeric value from available components (average non-null c/p/a/s/t)
          const primaryVals = ["c", "p", "a", "s", "t"]
            .map((k) => toNumber((r as any)[k]))
            .filter((n) => n !== null) as number[];

          let rowVal: number | null = null;
          if (primaryVals.length > 0) {
            const sum = primaryVals.reduce((a, b) => a + b, 0);
            rowVal = sum / primaryVals.length;
          } else {
            const otherNums = Object.values(r).map(toNumber).filter((n) => n !== null) as number[];
            if (otherNums.length === 1) rowVal = otherNums[0];
            else if (otherNums.length > 1) {
              const sum = otherNums.reduce((a, b) => a + b, 0);
              rowVal = sum / otherNums.length;
            }
          }

          if (rowVal === null) continue;

          if (!buckets[skillType]) buckets[skillType] = [];
          buckets[skillType].push(round2(rowVal));
        }
      }

      // compute per-skill averages in canonical order
      const rowAverages = SKILL_ORDER.map((skill) => {
        const vals = buckets[skill] || [];
        if (!vals.length) return 0;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return round2(avg);
      });

      // compute player average as the mean of available skill averages (exclude zeros)
      const nonZero = rowAverages.filter((v) => v !== 0);
      const playerAvg = nonZero.length ? round2(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : 0;

      return {
        id: p.id,
        first_name: p.first_name ?? "",
        last_name: p.last_name ?? "",
        sessions_count: sessions.length,
        avg_rating: playerAvg,
        row_averages: rowAverages,
        sessions,
      };
    });

    return NextResponse.json({ players: out });
  } catch (err) {
    console.error("Unexpected server error:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}