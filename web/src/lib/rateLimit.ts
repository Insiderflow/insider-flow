import { NextRequest } from 'next/server';

type WindowBucket = {
  count: number;
  resetAt: number;
};

const windowBuckets = new Map<string, WindowBucket>();

function nowMs() {
  return Date.now();
}

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export function enforceRouteRateLimit(
  request: NextRequest,
  routeKey: string,
  maxRequests: number,
  windowMs: number,
) {
  const ip = getRequestIp(request);
  const key = `${routeKey}:${ip}`;
  const now = nowMs();
  const existing = windowBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    windowBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }

  if (existing.count >= maxRequests) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  windowBuckets.set(key, existing);
  return { ok: true as const };
}

type TokenBucket = { tokens: number; last: number };

const tokenBuckets = new Map<string, TokenBucket>();

// Simple token bucket per key (e.g., IP+route). Refill rate r/s, capacity c.
export function rateLimit(key: string, capacity = 30, refillPerSecond = 1) {
  const now = Date.now();
  const bucket = tokenBuckets.get(key) || { tokens: capacity, last: now };
  const elapsed = (now - bucket.last) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSecond);
  bucket.last = now;
  if (bucket.tokens < 1) {
    tokenBuckets.set(key, bucket);
    return { allowed: false, retryAfterMs: 1000 / refillPerSecond };
  }
  bucket.tokens -= 1;
  tokenBuckets.set(key, bucket);
  return { allowed: true };
}

export function keyFromRequest(req: Request | import('next/server').NextRequest, name: string) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'local';
  return `${name}:${ip}`;
}
