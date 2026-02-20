import { NextResponse } from 'next/server';

export const runtime = 'edge';

function parseCookies(cookieHeader: string | null) {
  const map: Record<string,string> = {};
  if (!cookieHeader) return map;
  cookieHeader.split(';').forEach(part => {
    const [k, ...v] = part.split('=');
    if (!k) return;
    const key = k.trim();
    const val = v.join('=').trim();
    map[key] = decodeURIComponent(val || '');
  });
  return map;
}

export async function GET(request: any, context: any) {
  try {
    // normalize params: some Next types may provide params as a Promise in build environments
    let paramsObj = context?.params;
    if (paramsObj && typeof paramsObj.then === 'function') {
      try { paramsObj = await paramsObj; } catch (e) { paramsObj = undefined; }
    }

    const cookieHeader = request.headers?.get ? request.headers.get('cookie') : (request.headers && request.headers.cookie) || null;
    const cookies = parseCookies(cookieHeader);
    const adminFlag = cookies['pc_admin_authed'] || '';

    // reconstruct original admin path
    const rest = paramsObj?.path ? '/' + (Array.isArray(paramsObj.path) ? paramsObj.path.join('/') : String(paramsObj.path)) : '';
    const originalPath = '/admin' + rest;

    // allow the top-level `/admin` page to load even when not admin (unlock form)
    if (originalPath !== '/admin' && adminFlag !== '1') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // permit the request to continue to the original destination
    return NextResponse.next();
  } catch (err) {
    return NextResponse.next();
  }
}

export async function POST(request: any, context: any) {
  return GET(request, context);
}
