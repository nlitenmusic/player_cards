import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMacroTier } from "../../../lib/tiers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) console.error("Missing SUPABASE env vars for server API");

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

// Return leaderboards for skill x component pairs. If query contains `skill` and `comp`,
// return only that leaderboard. Otherwise return a map of all leaderboards.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const skill = url.searchParams.get("skill");
    const comp = url.searchParams.get("comp");
    const limit = Number(url.searchParams.get("limit") || 50);

    // valid comps: c,p,a,s,t
    const validComps = new Set(["c", "p", "a", "s", "t"]);

    // helper to build leaderboard for a single skill+comp
    async function buildLeaderboardFor(skillType: string, component: string, allowedTier?: string) {
      // Align with /api/players aggregation: fetch players with sessions -> session_stats
      // and compute per-player averages for the given skill/component in JS.
      function toNumber(v: unknown): number | null {
        if (v === null || v === undefined || v === "") return null;
        if (typeof v === "number") return v as number;
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
      }
      function round2(n: number) { return Math.round(n * 100) / 100; }

      const col = component;
      const { data: playersData, error: playersErr } = await supabaseServer
        .from("players")
        .select(`id, first_name, last_name, sessions(id, player_id, session_date, session_stats(c,p,a,s,t,skill_type))`);

      if (playersErr || !playersData) return [];

      const entries: { player_id: number; value: number }[] = [];

      for (const p of (playersData as any[])) {
        const pid = p.id as number;
        const sessions = p.sessions || [];
        const vals: number[] = [];

        for (const s of sessions) {
          const stats = s.session_stats || [];
          for (const r of stats) {
            const skillNorm = String(r?.skill_type ?? "").trim().toLowerCase();
            if (skillNorm !== skillType) continue;

            let v: number | null = null;
            if (skillType === "movement") {
              v = toNumber(r?.t);
            } else {
              v = toNumber(r?.[col]);
            }
            if (v == null) continue;
            vals.push(round2(v));
          }
        }

        if (!vals.length) continue;

        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

        // compute player's macro tier (align with /api/players calculation)
        const SKILL_ORDER = ["serve","return","forehand","backhand","volley","overhead","movement"];
        const buckets: Record<string, number[]> = {};
        for (const s of sessions) {
          const stats = s.session_stats || [];
          for (const r of stats) {
            const st = String(r?.skill_type ?? "").trim().toLowerCase();
            if (!st) continue;
            if (st === "movement") {
              const tv = toNumber(r?.t);
              if (tv !== null) { if (!buckets[st]) buckets[st] = []; buckets[st].push(round2(tv)); }
              continue;
            }
            const primaryVals = ["c","p","a","s","t"].map((k)=>toNumber((r as any)[k])).filter((n)=>n!=null) as number[];
            let rowVal: number | null = null;
            if (primaryVals.length>0) rowVal = primaryVals.reduce((a,b)=>a+b,0)/primaryVals.length;
            else {
              const otherNums = Object.values(r).map(toNumber).filter((n)=>n!=null) as number[];
              if (otherNums.length===1) rowVal = otherNums[0];
              else if (otherNums.length>1) rowVal = otherNums.reduce((a,b)=>a+b,0)/otherNums.length;
            }
            if (rowVal==null) continue;
            if (!buckets[st]) buckets[st]=[];
            buckets[st].push(round2(rowVal));
          }
        }
        const rowAverages = SKILL_ORDER.map((skill) => {
          const vals2 = buckets[skill] || [];
          if (!vals2.length) return 0;
          const a = vals2.reduce((x,y)=>x+y,0)/vals2.length; return round2(a);
        });
        const nonZero = rowAverages.filter((v)=>v!==0);
        const playerAvg = nonZero.length ? round2(nonZero.reduce((a,b)=>a+b,0)/nonZero.length) : 0;
        const playerTier = getMacroTier(playerAvg).name.toLowerCase();
        if (allowedTier && allowedTier.trim().toLowerCase() !== playerTier) continue;

        entries.push({ player_id: pid, value: round2(avg) });
      }

      const sorted = entries.sort((a, b) => b.value - a.value).slice(0, limit);

      // fetch player names for the top entries (optional optimization)
      const ids = sorted.map((e) => e.player_id).filter(Boolean);
      let players: any[] = [];
      if (ids.length) {
        const { data: pData } = await supabaseServer.from("players").select("id,first_name,last_name").in("id", ids);
        players = pData || [];
      }

      return sorted.map((r) => {
        const p = players.find((x) => x.id === r.player_id) || {};
        return { player_id: r.player_id, first_name: p.first_name ?? "", last_name: p.last_name ?? "", value: Number(r.value) };
      });
    }

    // list of skills canonical
    const SKILLS = ["serve","return","forehand","backhand","volley","overhead","movement"];

    const tierParam = url.searchParams.get("tier");

    if (skill && comp) {
      if (!validComps.has(comp)) return NextResponse.json({ error: "invalid component" }, { status: 400 });
      const leaderboard = await buildLeaderboardFor(skill.toLowerCase(), comp, tierParam ?? undefined);
      return NextResponse.json({ skill: skill.toLowerCase(), comp, tier: tierParam ?? null, entries: leaderboard });
    }

    // build all leaderboards (limited)
    const out: Record<string, Record<string, any[]>> = {};
    for (const s of SKILLS) {
      out[s] = {};
      for (const c of Array.from(validComps)) {
        out[s][c] = await buildLeaderboardFor(s, c);
      }
    }

    return NextResponse.json({ leaderboards: out });
  } catch (err) {
    console.error("leaderboards error", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}
