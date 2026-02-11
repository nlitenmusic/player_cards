import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { requester_id, requester_email, message } = body
    if (!requester_id) return NextResponse.json({ error: 'missing requester_id' }, { status: 400 })

    // Prevent duplicate pending requests from the same requester
    const { data: existing, error: e1 } = await supabaseAdmin
      .from('coach_requests')
      .select('id, status, created_at')
      .eq('requester_id', requester_id)
      .eq('status', 'pending')
      .limit(1)

    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'A pending request already exists for this user' }, { status: 409 })
    }

    const { first_name, last_name, affiliation } = body;

    const insertPayload: any = {
      requester_id,
      requester_email: requester_email || null,
      message: message || null,
      first_name: first_name || null,
      last_name: last_name || null,
      affiliation: affiliation || null,
    };

    const { data, error } = await supabaseAdmin
      .from('coach_requests')
      .insert(insertPayload)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, request: data?.[0] ?? null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
