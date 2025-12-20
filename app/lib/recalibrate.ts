import { SupabaseClient } from '@supabase/supabase-js';
import { getBand, normalizeKey } from './referenceKey';

type RecalcResult = {
  player_id: string;
  mode: 'test' | 'production';
  created: number; // number of rows written
  details: any;
};

export async function recalibratePlayer(
  supabaseServer: SupabaseClient,
  player_id: string,
  mode: 'test' | 'production',
  triggered_by?: string,
  notes?: string
): Promise<RecalcResult> {
  const useTest = mode === 'test';
  const sessionsTable = useTest ? 'test_sessions' : 'sessions';
  const statsTable = useTest ? 'test_session_stats' : 'session_stats';

  // find the first session for the player (baseline)
  const { data: sessionsData, error: sessErr } = await supabaseServer
    .from(sessionsTable)
    .select('id, session_date')
    .eq('player_id', player_id)
    .order('session_date', { ascending: true })
    .limit(1);

  if (sessErr) throw sessErr;
  const session = (sessionsData && (sessionsData as any[])[0]) || null;
  if (!session) {
    // nothing to recalibrate
    return { player_id, mode, created: 0, details: { message: 'no session found' } };
  }

  const sessionId = (session as any).id;

  // fetch stats for that session
  const { data: statsRows, error: statsErr } = await supabaseServer
    .from(statsTable)
    .select('id, skill_type, c, p, a, s, t')
    .eq('session_id', sessionId);

  if (statsErr) throw statsErr;
  const before = statsRows || [];

  const toInsert: any[] = [];

  function toNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  for (const r of before) {
    const skillType = String(r.skill_type || '').trim();
    const key = skillType.toLowerCase();
    let normalized_value: number | null = null;
    if (key === 'movement') {
      const tv = toNumber((r as any).t);
      if (tv !== null) normalized_value = Math.round(tv * 100) / 100;
    } else {
      const primaryVals = [toNumber((r as any).c), toNumber((r as any).p), toNumber((r as any).a), toNumber((r as any).s), toNumber((r as any).t)].filter((n) => n !== null) as number[];
      if (primaryVals.length > 0) {
        const avg = primaryVals.reduce((a, b) => a + b, 0) / primaryVals.length;
        normalized_value = Math.round(avg * 100) / 100;
      } else {
        const anyNums = Object.values(r).map(toNumber).filter((n) => n !== null) as number[];
        if (anyNums.length === 1) normalized_value = Math.round(anyNums[0] * 100) / 100;
        else if (anyNums.length > 1) {
          const avg = anyNums.reduce((a, b) => a + b, 0) / anyNums.length;
          normalized_value = Math.round(avg * 100) / 100;
        }
      }
    }

    // pick component for band lookup
    let compUsed = 'c';
    if (key === 'movement') compUsed = 't';
    else if (toNumber((r as any).c) === null) {
      if (toNumber((r as any).p) !== null) compUsed = 'p';
      else if (toNumber((r as any).a) !== null) compUsed = 'a';
      else if (toNumber((r as any).s) !== null) compUsed = 's';
      else if (toNumber((r as any).t) !== null) compUsed = 't';
    }

    const bandV = normalized_value == null ? null : Math.round(normalized_value);
    const bandEntry = bandV == null ? null : getBand(skillType || '', compUsed, bandV);
    const normalized_band = bandEntry ? bandEntry.name : null;

    toInsert.push({
      session_id: sessionId,
      player_id,
      skill_type: skillType,
      c: (r as any).c ?? null,
      p: (r as any).p ?? null,
      a: (r as any).a ?? null,
      s: (r as any).s ?? null,
      t: (r as any).t ?? null,
      normalized_value,
      normalized_band,
      is_test: useTest ? true : false,
      recalibrated_at: new Date().toISOString(),
    });
  }

  // insert recalculated rows into target stats table
  const { error: insertErr } = await supabaseServer.from(statsTable).insert(toInsert);
  if (insertErr) throw insertErr;

  // write an audit row to stat_recalibration_log
  const details = { before, after: toInsert };
  const { error: logErr } = await supabaseServer.from('stat_recalibration_log').insert([{ player_id, mode, triggered_by: triggered_by ?? null, notes: notes ?? null, details }]);
  if (logErr) throw logErr;

  return { player_id, mode, created: toInsert.length, details };
}

export default recalibratePlayer;
