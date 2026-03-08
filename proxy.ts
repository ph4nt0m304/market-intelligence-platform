import { NextRequest, NextResponse } from 'next/server';

type RateEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? '60000');
const RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX ?? '100');

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

function getRateStore(): Map<string, RateEntry> {
  const g = globalThis as typeof globalThis & { __apiRateStore?: Map<string, RateEntry> };
  if (!g.__apiRateStore) g.__apiRateStore = new Map<string, RateEntry>();
  return g.__apiRateStore;
}

function checkToken(req: NextRequest): boolean {
  const requiredToken = process.env.API_TOKEN;
  if (!requiredToken) return true;
  const authHeader = req.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const queryToken = req.nextUrl.searchParams.get('token') || undefined;
  return bearer === requiredToken || queryToken === requiredToken;
}

function shouldBypass(pathname: string): boolean {
  return (
    pathname === '/api/health' ||
    pathname.startsWith('/api/auth/')
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (shouldBypass(pathname)) return NextResponse.next();

  if (!checkToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const store = getRateStore();
  const now = Date.now();
  const key = getClientIp(req);
  const current = store.get(key);

  if (!current || now > current.resetAt) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    res.headers.set('X-RateLimit-Remaining', String(RATE_LIMIT_MAX - 1));
    return res;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((current.resetAt - now) / 1000)) } }
    );
  }

  current.count += 1;
  store.set(key, current);
  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  res.headers.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX - current.count)));
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
