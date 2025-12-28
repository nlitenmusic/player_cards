import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = body.mode || 'all';
    const player_id = body.player_id || null;

    // This endpoint expects to run server-side with SUPABASE_SERVICE_ROLE set in env
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    // Implementation: compute leaderboard-based achievements (rule_type = 'top_by_skill')
    // Use the official supabase-js client with the service role key for server-side operations
    const supabase = createClient(String(SUPABASE_URL), String(SERVICE_ROLE));

    // fetch achievements with simple leaderboard rule
    const { data: achievements, error: achErr } = await supabase.from('achievements').select('*').eq('rule_type', 'top_by_skill');
    if (achErr) return NextResponse.json({ error: achErr.message }, { status: 500 });

    const summary: any[] = [];

    for (const ach of (achievements || [])) {
      try {
        const payload = ach.rule_payload || {};
        const skill = String(payload.skill || payload.skill_type || '').trim();
        const comp = String(payload.component || 'c').trim();
        const topN = Number(payload.top_n || payload.topN || 1) || 1;
        if (!skill) {
          summary.push({ achievement: ach.key, status: 'skipped', reason: 'missing skill in rule_payload' });
          continue;
        }

        // fetch session_stats for this skill. NOTE: some schemas store a single `value` + `component`,
        // while others store component columns like `c`,`p`,`a`,`s`,`t`. We support both shapes.
        const { data: stats, error: statsErr } = await supabase
          .from('session_stats')
          .select('*')
          .ilike('skill_type', skill)
          .limit(100000);
        if (statsErr) { summary.push({ achievement: ach.key, status: 'error', error: statsErr.message }); continue; }

        // collect session_ids and map session->player
        const sessionIds = Array.from(new Set((stats || []).map((s:any) => s.session_id))).filter(Boolean);
        let sessionsMap: Record<string, any> = {};
        if (sessionIds.length) {
          const { data: sessionsData, error: sessErr } = await supabase.from('sessions').select('id,player_id').in('id', sessionIds).limit(100000);
          if (sessErr) { summary.push({ achievement: ach.key, status: 'error', error: sessErr.message }); continue; }
          for (const s of (sessionsData || [])) sessionsMap[s.id] = s.player_id;
        }

        // aggregate values per player. Extract the numeric value for the requested component.
        const playerVals: Record<string, number[]> = {};
        function extractValue(row:any, component:string) {
          // explicit `value` + `component` shape
          if (row.value !== undefined && row.value !== null) {
            return Number(row.value);
          }
          // per-component columns shape (c/p/a/s/t)
          if (component && row[component] !== undefined && row[component] !== null) {
            return Number(row[component]);
          }
          // some rows may have a `component` column indicating which column holds the value
          if (row.component && row[row.component] !== undefined && row[row.component] !== null) {
            return Number(row[row.component]);
          }
          return null;
        }

        for (const st of (stats || [])) {
          const pid = sessionsMap[st.session_id];
          if (!pid) continue;
          const v = extractValue(st, comp);
          if (v === null || !Number.isFinite(v as number)) continue;
          playerVals[pid] = playerVals[pid] || [];
          playerVals[pid].push(v as number);
        }

        const avgs = Object.entries(playerVals).map(([pid, vals]) => ({ player_id: pid, avg: vals.reduce((a,b)=>a+b,0)/vals.length }));
        avgs.sort((a,b)=>b.avg - a.avg);
        // include ties: find the cutoff average at position topN-1, then include everyone with avg >= cutoff
        let winners:any[] = [];
        if (avgs.length === 0) winners = [];
        else if (avgs.length <= topN) winners = avgs.map(a=>a.player_id);
        else {
          const cutoff = avgs[topN - 1].avg;
          winners = avgs.filter(a => a.avg >= cutoff).map(a => a.player_id);
        }

        // fetch existing awards for this achievement
        const { data: existing, error: existErr } = await supabase.from('player_achievements').select('id,player_id').eq('achievement_id', ach.id);
        if (existErr) { summary.push({ achievement: ach.key, status: 'error', error: existErr.message }); continue; }
        const existingIds = new Set((existing || []).map((r:any)=>String(r.player_id)));

        // Determine adds and removals (compare as strings)
        const toAdd = winners.filter((pid:any)=>!existingIds.has(String(pid)));
        const toRemove = (existing || []).map((r:any)=>String(r.player_id)).filter((pid:string)=>!winners.map(w=>String(w)).includes(pid));

        // Insert new awards
        if (toAdd.length) {
          const inserts = toAdd.map((pid:any) => ({ player_id: pid, achievement_id: ach.id, source: 'system', metadata: { avg: avgs.find(a=>String(a.player_id)===String(pid))?.avg ?? null } }));
          const { error: insErr } = await supabase.from('player_achievements').insert(inserts);
          if (insErr) { summary.push({ achievement: ach.key, status: 'error', error: insErr.message }); }
          else {
            // log each award
            for (const ins of inserts) {
              await supabase.from('achievement_award_log').insert({ player_achievement_id: null, action: 'awarded', actor: 'system', details: { achievement_id: ach.id, player_id: ins.player_id, metadata: ins.metadata } });
            }
          }
        }

        // Remove awards no longer valid
        if (toRemove.length) {
          const { error: delErr } = await supabase.from('player_achievements').delete().in('player_id', toRemove).eq('achievement_id', ach.id);
          if (delErr) { summary.push({ achievement: ach.key, status: 'error', error: delErr.message }); }
          else {
            for (const pid of toRemove) {
              await supabase.from('achievement_award_log').insert({ player_achievement_id: null, action: 'revoked', actor: 'system', details: { achievement_id: ach.id, player_id: pid } });
            }
          }
        }

        summary.push({ achievement: ach.key, status: 'synced', winners, added: toAdd.length, removed: toRemove.length });
      } catch (innerErr) {
        summary.push({ achievement: ach.key, status: 'error', error: String(innerErr) });
      }
    }

    return NextResponse.json({ status: 'ok', summary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
