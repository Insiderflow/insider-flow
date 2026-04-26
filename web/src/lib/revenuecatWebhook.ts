import crypto from 'crypto';
import { syncRevenueCatMembershipByUserIdWithContext } from '@/lib/revenuecat';

export function extractRevenueCatEvent(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return { eventType: 'unknown', eventKey: null as string | null, appUserId: null as string | null };
  }

  const root = payload as Record<string, unknown>;
  const event = (root.event && typeof root.event === 'object'
    ? (root.event as Record<string, unknown>)
    : root) as Record<string, unknown>;

  const eventType = typeof event.type === 'string' ? event.type : 'unknown';
  const appUserId = typeof event.app_user_id === 'string' ? event.app_user_id : null;

  if (typeof event.id === 'string' && event.id.length > 0) {
    return { eventType, eventKey: event.id, appUserId };
  }

  const timestamp = event.event_timestamp_ms ?? event.purchased_at_ms ?? '';
  const deterministicKey = `${eventType}:${appUserId || 'unknown'}:${String(timestamp)}`;
  const hash = crypto.createHash('sha256').update(deterministicKey).digest('hex');
  return { eventType, eventKey: `derived_${hash}`, appUserId };
}

export function verifyRevenueCatSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET || '';
  if (!secret) return { enabled: false, valid: true };
  if (!signatureHeader) return { enabled: true, valid: false };

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  const provided = signatureHeader.trim();
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return { enabled: true, valid: false };
  }

  return {
    enabled: true,
    valid: crypto.timingSafeEqual(expectedBuffer, providedBuffer),
  };
}

export async function processRevenueCatWebhookPayload(payload: unknown) {
  const { appUserId, eventKey, eventType } = extractRevenueCatEvent(payload);
  if (!appUserId) {
    throw new Error('Missing app_user_id');
  }

  const syncResult = await syncRevenueCatMembershipByUserIdWithContext(appUserId, {
    source: 'revenuecat_webhook',
    eventKey,
    eventType,
  });
  return {
    appUserId,
    syncResult,
  };
}
