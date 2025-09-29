import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const envCheck = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'Set' : 'Missing',
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'Missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
    NODE_ENV: process.env.NODE_ENV || 'Missing',
    // Show actual values for debugging
    NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL,
    SENDGRID_FROM_EMAIL_VALUE: process.env.SENDGRID_FROM_EMAIL
  };

  return NextResponse.json({
    environment: envCheck,
    timestamp: new Date().toISOString()
  });
}
