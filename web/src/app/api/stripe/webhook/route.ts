import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Minimal webhook endpoint to satisfy Next.js module export during builds.
// Stripe processing can be wired back later; for now we acknowledge events.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ received: true });
}

// Optional GET to keep module shape clear for type checker
export async function GET() {
  return NextResponse.json({ ok: true });
}


