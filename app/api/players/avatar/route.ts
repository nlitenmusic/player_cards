import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    if (!SERVICE_ROLE) {
      console.error('SUPABASE_SERVICE_ROLE is not set');
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE is not set on server' }, { status: 500 });
    }
    const body = await req.json();
    const playerIdRaw = body?.player_id;
    const avatarUrl = body?.avatar_url;
    if (!playerIdRaw || !avatarUrl) {
      return NextResponse.json({ error: 'missing player_id or avatar_url' }, { status: 400 });
    }

    const playerId = String(playerIdRaw);
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(playerId)) {
      console.error('invalid player_id format', playerId);
      return NextResponse.json({ error: 'player_id must be a UUID (got ' + playerId + ')' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('players')
      .update({ avatar_url: avatarUrl })
      .eq('id', playerId)
      .select('id, avatar_url')
      .limit(1);

    if (error) {
      let errBody: any = error;
      try {
        errBody = JSON.parse(JSON.stringify(error));
      } catch (e) {
        errBody = { message: error.message ?? String(error) };
      }
      console.error('avatar update error', errBody);
      return NextResponse.json({ error: errBody }, { status: 500 });
    }

    return NextResponse.json({ updated: data?.[0] ?? null });
  } catch (err) {
    console.error('unexpected avatar update error', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
