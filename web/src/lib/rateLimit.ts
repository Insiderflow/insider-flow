type Bucket = { tokens: number; last: number };

const buckets = new Map<string, Bucket>();

// Simple token bucket per key (e.g., IP+route). Refill rate r/s, capacity c.
export function rateLimit(key: string, capacity = 30, refillPerSecond = 1) {
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: capacity, last: now };
  const elapsed = (now - bucket.last) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSecond);
  bucket.last = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs: 1000 / refillPerSecond };
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { allowed: true };
}

export function keyFromRequest(req: Request | import('next/server').NextRequest, name: string) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'local';
  return `${name}:${ip}`;
}


