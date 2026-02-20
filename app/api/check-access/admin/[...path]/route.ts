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

export async function GET(req: Request, { params }: { params: { path?: string[] } }) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const adminFlag = cookies['pc_admin_authed'] || '';

    // reconstruct original admin path
    const rest = params?.path ? '/' + params.path.join('/') : '';
    const originalPath = '/admin' + rest;

    // allow the top-level `/admin` page to load even when not admin (unlock form)
    if (originalPath !== '/admin' && adminFlag !== '1') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // permit the request to continue to the original destination
    return NextResponse.next();
  } catch (err) {
    return NextResponse.next();
  }
}

export async function POST(req: Request, { params }: { params: { path?: string[] } }) {
  return GET(req, { params });
}
