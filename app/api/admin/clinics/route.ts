import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for server API");
}

const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body?.name ?? null;
    const date = body?.date ?? null;
    const draft = typeof body?.draft === 'boolean' ? body.draft : true;

    const insertObj: any = {};
    if (name !== null) insertObj.name = name;
    if (date !== null) insertObj.date = date;
    insertObj.draft = draft;

    const { data, error } = await supabaseServer.from('clinics').insert([insertObj]).select().limit(1);
    if (error) {
      console.error('clinics POST supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const clinic = Array.isArray(data) && data.length ? data[0] : null;
    return NextResponse.json({ clinic });
  } catch (err: any) {
    console.error('clinics POST unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const updateObj: any = { ...(body || {}) };
    delete updateObj.id;

    const { data, error } = await supabaseServer.from('clinics').update(updateObj).eq('id', id).select().limit(1);
    if (error) {
      console.error('clinics PATCH supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const clinic = Array.isArray(data) && data.length ? data[0] : null;
    return NextResponse.json({ clinic });
  } catch (err: any) {
    console.error('clinics PATCH unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
