import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SimpleTtlCache } from "../lib/cache";
import { createRateLimiter } from "../middlewares/rate-limit";

describe("Cache & Rate Limiting", () => {
  test("SimpleTtlCache stores, retrieves and deletes values", () => {
    const cache = new SimpleTtlCache<string>(60);
    cache.set("key1", "value1");

    assert.equal(cache.get("key1"), "value1");
    assert.equal(cache.has("key1"), true);
    assert.equal(cache.get("nonexistent"), undefined);

    cache.delete("key1");
    assert.equal(cache.get("key1"), undefined);
  });

  test("SimpleTtlCache expires values based on TTL", async () => {
    // 0.05 seconds TTL
    const cache = new SimpleTtlCache<number>(0.05);
    cache.set("ephemeral", 123);
    assert.equal(cache.get("ephemeral"), 123);

    await new Promise((r) => setTimeout(r, 70));
    assert.equal(cache.get("ephemeral"), undefined);
  });

  test("Rate limiter enforces request threshold and sets Retry-After", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 2,
      message: "Rate limit reached",
    });

    let statusCode = 200;
    let headers: Record<string, any> = {};
    let responseBody: any = null;

    const mockRes = {
      setHeader(k: string, v: any) {
        headers[k] = v;
      },
      status(code: number) {
        statusCode = code;
        return {
          json(body: any) {
            responseBody = body;
          },
        };
      },
    } as any;

    const mockReq = {
      ip: "127.0.0.1",
      baseUrl: "/api",
      path: "/tmdb/search",
      socket: { remoteAddress: "127.0.0.1" },
    } as any;

    let calledNext = false;
    const next = () => {
      calledNext = true;
    };

    // Request 1: allowed
    calledNext = false;
    limiter(mockReq, mockRes, next);
    assert.equal(calledNext, true);

    // Request 2: allowed
    calledNext = false;
    limiter(mockReq, mockRes, next);
    assert.equal(calledNext, true);

    // Request 3: blocked with 429
    calledNext = false;
    limiter(mockReq, mockRes, next);
    assert.equal(calledNext, false);
    assert.equal(statusCode, 429);
    assert.equal(responseBody.error, "Rate limit reached");
    assert.ok(headers["Retry-After"] !== undefined);
  });
});
