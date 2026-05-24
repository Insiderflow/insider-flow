import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { assertAdminRequest, assertInternalJobRequest } from '@/lib/admin';

/** Hide dev-only routes in production (same pattern as /api/dev/*). */
export function notFoundInProduction(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return null;
}

export function requireInternalJob(
  request: NextRequest,
): NextResponse | null {
  const blocked = notFoundInProduction();
  if (blocked) return blocked;

  const auth = assertInternalJobRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }
  return null;
}

export function requireAdmin(
  request: NextRequest,
): NextResponse | null {
  const blocked = notFoundInProduction();
  if (blocked) return blocked;

  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }
  return null;
}
