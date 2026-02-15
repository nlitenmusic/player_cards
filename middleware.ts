import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  try {
    const adminFlag = req.cookies.get('pc_admin_authed')?.value ?? '';
    const coachFlag = req.cookies.get('pc_coach_authed')?.value ?? '';
    const role = req.cookies.get('pc_role')?.value ?? '';

    // Protect admin routes: require explicit admin unlock
    // Allow the top-level `/admin` page so the unlock form can load in the browser.
    if (path.startsWith('/admin')) {
      if (path !== '/admin' && adminFlag !== '1') return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // If a coach is signed in, send them to the coach realm when they hit the root
    if (path === '/' && coachFlag === '1') {
      return NextResponse.redirect(new URL('/coach', req.url));
    }

    // Note: coach route protection is handled client-side.
    // Allow the `/coach` pages to load so signed-in users (without server cookies yet)
    // can be shown the RequestCoachForm and finish onboarding in the browser.
  } catch (e) {
    // if cookie access fails, be conservative and allow UI/server-level checks to handle it
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/coach/:path*'],
}
