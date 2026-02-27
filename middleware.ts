import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect coach/admin/account routes server-side and redirect unauthenticated
// visitors to the sign-in page while leaving the public site browsable.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // During local development, skip protection so `/admin` and related
  // routes remain accessible without needing cookies. This prevents
  // redirect loops while developing. Remove or restrict in production.
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  // Only guard these top-level routes (and subpaths). Do NOT protect the
  // sign-in page itself (`/account`) to avoid redirect loops when middleware
  // redirects unauthenticated users to the login page.
  const shouldProtect = pathname.startsWith('/coach') || pathname.startsWith('/admin') || pathname.startsWith('/account/')
  if (!shouldProtect) return NextResponse.next()

  // Allow API calls and static assets through
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next()

  const cookies = req.cookies

  // Existing client-side flags set by the app
  const hasCoachCookie = cookies.get('pc_coach_authed')?.value === '1'
  const hasAdminCookie = cookies.get('pc_admin_authed')?.value === '1'

  // Try common Supabase cookie names as fallback (best-effort)
  const hasSupabaseToken = Boolean(cookies.get('sb-access-token') || cookies.get('sb-access-token') || cookies.get('sb_refresh_token') || cookies.get('sb:token'))

  if (hasCoachCookie || hasAdminCookie || hasSupabaseToken) {
    return NextResponse.next()
  }

  // Not authenticated for protected route -> redirect to login with return_to
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/account'
  loginUrl.searchParams.set('return_to', pathname + search)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/coach/:path*', '/admin/:path*', '/account/:path*']
}
