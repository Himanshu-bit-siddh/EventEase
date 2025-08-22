import type { NextRequest } from "next/server";

type RateLimitEntry = {
  hits: number;
  resetAt: number; // epoch ms
};

declare global {
  // Store per-process; acceptable for single-instance dev. Use Redis in prod.
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store: Map<string, RateLimitEntry> = global.__rateLimitStore || new Map();
global.__rateLimitStore = store;

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
};

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { hits: 1, resetAt });
    return { limited: false, remaining: limit - 1, limit, resetAt };
  }

  if (existing.hits >= limit) {
    return { limited: true, remaining: 0, limit, resetAt: existing.resetAt };
  }

  existing.hits += 1;
  store.set(key, existing);
  return { limited: false, remaining: Math.max(0, limit - existing.hits), limit, resetAt: existing.resetAt };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (result.limited) {
    const retryAfterSec = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000));
    headers["Retry-After"] = String(retryAfterSec);
  }
  return headers;
}


