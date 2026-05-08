import { NextRequest, NextResponse } from 'next/server';
import {
  beginSubscriptionEventProcessing,
  markSubscriptionEventFailed,
  markSubscriptionEventProcessed,
} from '@/lib/subscriptionEvents';
import {
  extractRevenueCatEvent,
  processRevenueCatWebhookPayload,
  verifyRevenueCatSignature,
} from '@/lib/revenuecatWebhook';
import { enforceRouteRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

function getWebhookSecret() {
  return process.env.REVENUECAT_WEBHOOK_AUTH || '';
}

function isAuthorized(request: NextRequest) {
  const configured = getWebhookSecret();
  if (!configured) return false;
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) return false;
  const token = authHeader.slice(7).trim();
  return token === configured;
}

export async function POST(req: NextRequest) {
  try {
    const rate = enforceRouteRateLimit(req, 'revenuecat_webhook', 120, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many requests', retry_after_seconds: rate.retryAfterSeconds },
        { status: 429 },
      );
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await req.text();
    const signatureCheck = verifyRevenueCatSignature(rawBody, req.headers.get('x-revenuecat-signature'));
    if (signatureCheck.enabled && !signatureCheck.valid) {
      return NextResponse.json({ error: 'Invalid RevenueCat signature' }, { status: 401 });
    }
    let payload: unknown = {};
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as unknown;
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
    }
    const { appUserId, eventKey, eventType } = extractRevenueCatEvent(payload);
    if (!appUserId) {
      return NextResponse.json({ error: 'Missing app_user_id' }, { status: 400 });
    }
    if (!eventKey) {
      return NextResponse.json({ error: 'Missing event key' }, { status: 400 });
    }

    const eventProcessing = await beginSubscriptionEventProcessing({
      provider: 'revenuecat',
      eventKey,
      eventType,
      payload,
    });
    if (eventProcessing.duplicate) {
      return NextResponse.json({ received: true, duplicate: true, app_user_id: appUserId });
    }

    try {
      const { syncResult } = await processRevenueCatWebhookPayload(payload);
      if (eventProcessing.id) {
        await markSubscriptionEventProcessed(eventProcessing.id);
      }
      return NextResponse.json({
        received: true,
        app_user_id: appUserId,
        membership_tier: syncResult.isPaid ? 'pro' : 'free',
        subscription_status: syncResult.subscriptionStatus,
        billing_provider: syncResult.billingProvider,
        membership_expires_at: syncResult.membershipExpiresAt?.toISOString() || null,
        subscription_entitlement_id: syncResult.activeEntitlementId,
      });
    } catch (error) {
      if (eventProcessing.id) {
        await markSubscriptionEventFailed(
          eventProcessing.id,
          error instanceof Error ? error.message : String(error),
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('RevenueCat webhook processing failed', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'RevenueCat webhook endpoint is active',
    webhook_secret_configured: !!process.env.REVENUECAT_WEBHOOK_AUTH,
    revenuecat_key_configured: !!process.env.REVENUECAT_SECRET_API_KEY,
    revenuecat_signature_configured: !!process.env.REVENUECAT_WEBHOOK_SECRET,
  });
}
