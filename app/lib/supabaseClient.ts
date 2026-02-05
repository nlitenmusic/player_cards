import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE env vars for client')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export default supabase
