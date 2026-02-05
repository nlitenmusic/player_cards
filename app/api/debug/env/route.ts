import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not allowed in production' }, { status: 403 });
  }

  if (!SUPABASE_SERVICE_ROLE) {
    return NextResponse.json({ serviceRolePresent: false });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  try {
    const { data } = await admin.storage.getBucket('avatars');
    const bucketExists = !!data;
    return NextResponse.json({ serviceRolePresent: true, bucketExists });
  } catch (err: any) {
    return NextResponse.json({ serviceRolePresent: true, bucketExists: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
