import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    GRIDSEND_API_KEY: process.env.GRIDSEND_API_KEY ? 'Set' : 'Missing',
    EMAIL_FROM: process.env.EMAIL_FROM || 'Missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Missing',
    NODE_ENV: process.env.NODE_ENV || 'Missing',
    // Show actual values for debugging
    NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_BASE_URL_VALUE: process.env.NEXT_PUBLIC_BASE_URL,
    EMAIL_FROM_VALUE: process.env.EMAIL_FROM
  };

  return NextResponse.json({
    environment: envCheck,
    timestamp: new Date().toISOString()
  });
}
