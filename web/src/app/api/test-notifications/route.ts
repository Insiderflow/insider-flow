import { NextRequest, NextResponse } from 'next/server';
import { processNewTrade } from '@/lib/notificationService';
import { requireAdmin } from '@/lib/routeGuards';

export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;

  try {
    const { politicianId, politicianName, issuerName, type, tradedAt } =
      await request.json();

    if (!politicianId || !politicianName || !issuerName || !type || !tradedAt) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: politicianId, politicianName, issuerName, type, tradedAt',
        },
        { status: 400 },
      );
    }

    const testTrade = {
      politician: {
        name: politicianName,
        id: politicianId,
      },
      issuer: {
        name: issuerName,
        id: 'test-issuer-id',
      },
      type: type,
      tradedAt: tradedAt,
    };

    await processNewTrade(testTrade);

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      trade: testTrade,
    });
  } catch (error) {
    console.error('Test notification failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
