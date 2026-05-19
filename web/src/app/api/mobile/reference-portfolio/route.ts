import { NextRequest, NextResponse } from 'next/server';
import type { ReferencePortfolioTemplate } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePaidMobileUser } from '@/lib/mobile/requirePaidMobile';
import {
  MAX_PORTFOLIOS_PER_USER,
  MAX_POSITION_LIMIT,
  equalWeights,
  rebuildPortfolioPositions,
  serializePortfolio,
} from '@/lib/mobile/referencePortfolioBuilder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TEMPLATES: ReferencePortfolioTemplate[] = [
  'politician_mirror',
  'flagged_buys',
];

function parseTemplate(raw: string | null): ReferencePortfolioTemplate | null {
  if (!raw) return null;
  return TEMPLATES.includes(raw as ReferencePortfolioTemplate)
    ? (raw as ReferencePortfolioTemplate)
    : null;
}

export async function GET(req: NextRequest) {
  const auth = await requirePaidMobileUser(req);
  if ('error' in auth) return auth.error;

  try {
    const rows = await prisma.userReferencePortfolio.findMany({
      where: { user_id: auth.user.id },
      include: {
        Politician: { select: { name: true } },
        positions: { orderBy: { weight_pct: 'desc' } },
      },
      orderBy: { updated_at: 'desc' },
    });

    return NextResponse.json({
      portfolios: rows.map(serializePortfolio),
      maxPortfolios: MAX_PORTFOLIOS_PER_USER,
      presets: [
        {
          template: 'flagged_buys',
          nameKey: 'flagged_buys_default',
          periodDays: 7,
          positionLimit: 8,
        },
        {
          template: 'flagged_buys',
          nameKey: 'flagged_buys_month',
          periodDays: 30,
          positionLimit: 10,
        },
      ],
    });
  } catch (error) {
    console.error('mobile/reference-portfolio GET', error);
    return NextResponse.json(
      { error: 'Failed to load portfolios' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePaidMobileUser(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const template = parseTemplate(body.template);
    if (!template) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    const periodDays = Math.min(
      90,
      Math.max(1, Number(body.periodDays || body.period_days || 30)),
    );
    const positionLimit = Math.min(
      MAX_POSITION_LIMIT,
      Math.max(1, Number(body.positionLimit || body.position_limit || 10)),
    );
    const politicianId =
      body.politicianId || body.politician_id || null;
    const name =
      String(body.name || '').trim() ||
      (template === 'flagged_buys' ? '標記買入組合' : '議員跟隨組合');

    if (template === 'politician_mirror' && !politicianId) {
      return NextResponse.json(
        { error: 'politicianId required for politician_mirror' },
        { status: 400 },
      );
    }

    const portfolioId = body.id ? String(body.id) : null;
    let portfolio = portfolioId
      ? await prisma.userReferencePortfolio.findFirst({
          where: { id: portfolioId, user_id: auth.user.id },
        })
      : null;

    if (!portfolio) {
      const count = await prisma.userReferencePortfolio.count({
        where: { user_id: auth.user.id },
      });
      if (count >= MAX_PORTFOLIOS_PER_USER) {
        return NextResponse.json(
          { error: 'Portfolio limit reached', code: 'limit_reached' },
          { status: 409 },
        );
      }
      portfolio = await prisma.userReferencePortfolio.create({
        data: {
          user_id: auth.user.id,
          name,
          template,
          politician_id: politicianId,
          period_days: periodDays,
          position_limit: positionLimit,
        },
      });
    } else {
      portfolio = await prisma.userReferencePortfolio.update({
        where: { id: portfolio.id },
        data: {
          name,
          template,
          politician_id: politicianId,
          period_days: periodDays,
          position_limit: positionLimit,
        },
      });
    }

    const drafts = await rebuildPortfolioPositions(template, {
      politicianId,
      periodDays,
      positionLimit,
    });
    const weights = equalWeights(drafts.length);

    await prisma.$transaction([
      prisma.userReferencePortfolioPosition.deleteMany({
        where: { portfolio_id: portfolio.id },
      }),
      ...drafts.map((d, i) =>
        prisma.userReferencePortfolioPosition.create({
          data: {
            portfolio_id: portfolio!.id,
            ticker: d.ticker,
            issuer_name: d.issuerName,
            side: d.side,
            weight_pct: weights[i] ?? 0,
            source_trade_id: d.sourceTradeId,
            disclosure_date: d.disclosureDate,
          },
        }),
      ),
      prisma.userReferencePortfolio.update({
        where: { id: portfolio.id },
        data: { last_built_at: new Date() },
      }),
    ]);

    const full = await prisma.userReferencePortfolio.findUniqueOrThrow({
      where: { id: portfolio.id },
      include: {
        Politician: { select: { name: true } },
        positions: { orderBy: { weight_pct: 'desc' } },
      },
    });

    return NextResponse.json({ portfolio: serializePortfolio(full) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'politician_id_required') {
      return NextResponse.json(
        { error: 'politicianId required' },
        { status: 400 },
      );
    }
    console.error('mobile/reference-portfolio POST', error);
    return NextResponse.json(
      { error: 'Failed to save portfolio' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePaidMobileUser(req);
  if ('error' in auth) return auth.error;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await prisma.userReferencePortfolio.deleteMany({
    where: { id, user_id: auth.user.id },
  });

  return NextResponse.json({ success: true });
}
