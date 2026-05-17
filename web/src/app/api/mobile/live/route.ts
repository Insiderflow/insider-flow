import { NextRequest, NextResponse } from 'next/server';
import { buildInsiderLiveFeed, buildPoliticianLiveFeed } from '@/lib/mobile/liveBuilder';

export async function GET(req: NextRequest) {
  try {
    const mode = new URL(req.url).searchParams.get('mode') || 'politician';
    const data =
      mode === 'insider' ? await buildInsiderLiveFeed() : await buildPoliticianLiveFeed();
    return NextResponse.json(data);
  } catch (error) {
    console.error('mobile/live error', error);
    return NextResponse.json({ error: 'Failed to build live feed' }, { status: 500 });
  }
}
