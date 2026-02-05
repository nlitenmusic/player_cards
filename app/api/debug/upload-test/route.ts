import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  if (!SERVICE_ROLE) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE not set on server' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const playerId = String(body?.player_id ?? '');
    const uid = String(body?.uid ?? body?.user_id ?? 'debug');

    if (!playerId) return NextResponse.json({ error: 'missing player_id' }, { status: 400 });

    // Fetch a small placeholder image to use for testing upload
    const placeholderUrl = 'https://via.placeholder.com/512.png';
    const fetchRes = await fetch(placeholderUrl);
    if (!fetchRes.ok) return NextResponse.json({ error: 'failed to fetch placeholder image' }, { status: 502 });
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${Date.now()}_debug.png`;
    const filePath = `avatars/${uid}/${fileName}`;

    const { error: upError } = await supabaseServer.storage.from('avatars').upload(filePath, buffer, { upsert: true, contentType: 'image/png' });
    if (upError) {
      return NextResponse.json({ error: upError }, { status: 500 });
    }

    const { data: urlData } = supabaseServer.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = (urlData as any)?.publicUrl ?? null;

    const { data: updated, error: updateErr } = await supabaseServer
      .from('players')
      .update({ avatar_url: publicUrl })
      .eq('id', playerId)
      .select('id, avatar_url')
      .limit(1);

    if (updateErr) {
      return NextResponse.json({ error: updateErr }, { status: 500 });
    }

    return NextResponse.json({ uploaded: filePath, publicUrl, updated: updated?.[0] ?? null });
  } catch (err) {
    console.error('upload-test error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
