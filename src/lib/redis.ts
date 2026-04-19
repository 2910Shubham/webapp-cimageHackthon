import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client singleton.
 * Uses REST-based API — no persistent connections needed.
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;

// ─── Key Prefixes ────────────────────────────────────────────

const KEYS = {
  /** OTP storage with TTL: otp:<visitId> → "123456" */
  otp: (visitId: string) => `otp:${visitId}`,

  /** Active visitors set: active-visitors → Set<visitorId> */
  activeVisitors: "active-visitors",

  /** Blacklist set: blacklist → Set<visitorId> */
  blacklist: "blacklist",

  /** Rate limit counter: ratelimit:<ip> → count */
  rateLimit: (ip: string) => `ratelimit:${ip}`,
} as const;

export { KEYS };

// ─── OTP Operations ──────────────────────────────────────────

/** Store OTP with 5-minute TTL */
export async function storeOTP(visitId: string, otp: string): Promise<void> {
  await redis.set(KEYS.otp(visitId), otp, { ex: 300 }); // 5 minutes
}

/** Retrieve OTP (returns null if expired) */
export async function getOTP(visitId: string): Promise<string | null> {
  return redis.get<string>(KEYS.otp(visitId));
}

/** Delete OTP after successful use */
export async function deleteOTP(visitId: string): Promise<void> {
  await redis.del(KEYS.otp(visitId));
}

// ─── Active Visitor Operations ───────────────────────────────

/** Add visitor to active set on check-in */
export async function addActiveVisitor(visitorId: string): Promise<void> {
  await redis.sadd(KEYS.activeVisitors, visitorId);
}

/** Remove visitor from active set on check-out */
export async function removeActiveVisitor(visitorId: string): Promise<void> {
  await redis.srem(KEYS.activeVisitors, visitorId);
}

/** Get all active visitor IDs */
export async function getActiveVisitorIds(): Promise<string[]> {
  return redis.smembers(KEYS.activeVisitors);
}

/** Check if visitor is currently active */
export async function isVisitorActive(visitorId: string): Promise<boolean> {
  return redis.sismember(KEYS.activeVisitors, visitorId) as Promise<boolean>;
}

// ─── Blacklist Operations ────────────────────────────────────

/** Add visitor to blacklist cache */
export async function addToBlacklist(visitorId: string): Promise<void> {
  await redis.sadd(KEYS.blacklist, visitorId);
}

/** Remove visitor from blacklist cache */
export async function removeFromBlacklist(visitorId: string): Promise<void> {
  await redis.srem(KEYS.blacklist, visitorId);
}

/** Check blacklist — Redis first (sub-ms), never hits DB */
export async function isBlacklisted(visitorId: string): Promise<boolean> {
  return redis.sismember(KEYS.blacklist, visitorId) as Promise<boolean>;
}

// ─── Rate Limiting ───────────────────────────────────────────

/**
 * Increment rate limit counter for IP.
 * Returns current count. First call sets 60s TTL.
 */
export async function incrementRateLimit(ip: string): Promise<number> {
  const key = KEYS.rateLimit(ip);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 60-second window
  }
  return count;
}

/** Check if IP is rate limited (>10 requests/minute) */
export async function isRateLimited(ip: string): Promise<boolean> {
  const count = await redis.get<number>(KEYS.rateLimit(ip));
  return (count ?? 0) > 10;
}
