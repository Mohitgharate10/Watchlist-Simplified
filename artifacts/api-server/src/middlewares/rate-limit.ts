import type { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;
  const requests = new Map<string, number[]>();

  // Periodically clean up old entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, valid);
      }
    }
  }, Math.max(windowMs, 60000)).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${req.baseUrl || ""}${req.path}`;
    const now = Date.now();

    const timestamps = (requests.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      const oldest = timestamps[0];
      const resetTimeMs = windowMs - (now - oldest);
      const retryAfterSec = Math.ceil(resetTimeMs / 1000);

      res.setHeader("Retry-After", retryAfterSec);
      res.status(429).json({ error: message, retryAfter: retryAfterSec });
      return;
    }

    timestamps.push(now);
    requests.set(key, timestamps);
    next();
  };
}

export const tmdbRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: "TMDB rate limit exceeded, please slow down.",
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 attempts per minute
  message: "Too many authentication attempts, please wait a minute before trying again.",
});
