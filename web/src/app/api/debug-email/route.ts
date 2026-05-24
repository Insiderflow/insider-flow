import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/routeGuards';

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;

  const envCheck = {
    GRIDSEND_API_KEY: process.env.GRIDSEND_API_KEY ? 'Set' : 'Missing',
    EMAIL_FROM: process.env.EMAIL_FROM || 'Missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Missing',
    NODE_ENV: process.env.NODE_ENV || 'Missing',
  };

  return NextResponse.json({
    environment: envCheck,
    timestamp: new Date().toISOString(),
  });
}
