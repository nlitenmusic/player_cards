import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ is_coach: false })

    const { data, error } = await supabaseAdmin
      .from('coaches')
      .select('id')
      .eq('user_id', user_id)
      .limit(1)

    if (error) throw error

    return NextResponse.json({ is_coach: (data && data.length > 0) })
  } catch (err) {
    return NextResponse.json({ is_coach: false, error: String(err) }, { status: 500 })
  }
}
