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

    const { data, error } = await supabaseAdmin
      .from('coach_requests')
      .insert({ requester_id, requester_email: requester_email || null, message: message || null })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, request: data?.[0] ?? null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
