import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = (url.searchParams.get('role') || 'coach').toLowerCase();
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    const res = NextResponse.redirect(new URL('/coach', url));

    // Set role cookie
    res.cookies.set('pc_role', role, { path: '/', maxAge });

    // Set coach authed flag when role is coach
    if (role === 'coach') {
      res.cookies.set('pc_coach_authed', '1', { path: '/', maxAge });
    } else {
      res.cookies.set('pc_coach_authed', '', { path: '/', maxAge: 0 });
    }

    return res;
  } catch (err) {
    const res = NextResponse.json({ error: 'failed_to_set_role' }, { status: 500 });
    return res;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const role = ((body && body.role) || 'coach').toLowerCase();
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    const res = NextResponse.json({ success: true });
    res.cookies.set('pc_role', role, { path: '/', maxAge });
    if (role === 'coach') {
      res.cookies.set('pc_coach_authed', '1', { path: '/', maxAge });
    } else {
      res.cookies.set('pc_coach_authed', '', { path: '/', maxAge: 0 });
    }
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'failed_to_set_role' }, { status: 500 });
  }
}
