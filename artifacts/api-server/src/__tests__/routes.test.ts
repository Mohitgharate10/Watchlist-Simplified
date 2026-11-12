import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app";
import { tmdbSearchCache, tmdbProvidersCache } from "../lib/cache";
import { createToken } from "../lib/auth";

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as { port: number; address: string };
      baseUrl = `http://127.0.0.1:${address.port}/api`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe("API Routes & Bug Fixes Verification", () => {
  test("GET /api/healthz returns 200 healthy", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "ok");
  });

  describe("Bad ID handling (/items/:id)", () => {
    test("GET /items/abc returns 400 (was 500 before bug fix)", async () => {
      const res = await fetch(`${baseUrl}/items/abc`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes("Invalid item ID"));
    });

    test("GET /items/-5 returns 400", async () => {
      const res = await fetch(`${baseUrl}/items/-5`);
      assert.equal(res.status, 400);
    });

    test("PATCH /items/abc returns 400 (was 500 before bug fix)", async () => {
      const res = await fetch(`${baseUrl}/items/abc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes("Invalid item ID"));
    });

    test("DELETE /items/abc returns 400 (was 500 before bug fix)", async () => {
      const res = await fetch(`${baseUrl}/items/abc`, {
        method: "DELETE",
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes("Invalid item ID"));
    });

    test("POST /items/abc/refresh returns 400", async () => {
      const res = await fetch(`${baseUrl}/items/abc/refresh`, {
        method: "POST",
      });
      assert.equal(res.status, 400);
    });
  });

  describe("POST /items error handling", () => {
    test("POST /items returns 400 for invalid body schema with validation details", async () => {
      const res = await fetch(`${baseUrl}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, "Invalid item data");
      assert.ok(data.details !== undefined);
    });

    test("POST /items returns 400 when type is invalid", async () => {
      const res = await fetch(`${baseUrl}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Inception",
          type: "podcast", // invalid enum
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, "Invalid item data");
    });
  });

  describe("Authentication & Authorization", () => {
    test("POST /auth/register rejects invalid input with 400", async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "ab", email: "not-an-email", password: "123" }),
      });
      assert.equal(res.status, 400);
    });

    test("POST /auth/login rejects empty credentials with 400", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: "", password: "" }),
      });
      assert.equal(res.status, 400);
    });

    test("GET /auth/me returns 401 when unauthenticated", async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      assert.equal(res.status, 401);
    });

    test("GET /auth/me returns 401 with invalid Bearer token", async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: "Bearer bad.token.value" },
      });
      assert.equal(res.status, 401);
    });

    test("GET /auth/me returns 200 with valid Bearer token", async () => {
      const testUser = { id: 101, username: "cinephile", email: "cinephile@example.com" };
      const validToken = createToken(testUser);

      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, 101);
      assert.equal(data.username, "cinephile");
      assert.equal(data.email, "cinephile@example.com");
    });
  });

  describe("TMDB Proxy: Validation, Caching & Rate Limiting", () => {
    test("GET /tmdb/search returns 400 for queries shorter than 2 chars", async () => {
      const res = await fetch(`${baseUrl}/tmdb/search?q=a`);
      assert.equal(res.status, 400);
    });

    test("GET /tmdb/search serves cached results without calling TMDB API", async () => {
      const cacheKey = "search:all:testmovie";
      const cachedData = [
        {
          id: 999,
          title: "Cached Movie Test",
          type: "movie",
          year: 2024,
          posterUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
          description: "Test description",
          genre: "Sci-Fi",
        },
      ];
      tmdbSearchCache.set(cacheKey, cachedData);

      const res = await fetch(`${baseUrl}/tmdb/search?q=testmovie`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data, cachedData);
    });

    test("GET /tmdb/providers/:type/:id validates parameters", async () => {
      const resInvalidType = await fetch(`${baseUrl}/tmdb/providers/unknown/123`);
      assert.equal(resInvalidType.status, 400);

      const resInvalidId = await fetch(`${baseUrl}/tmdb/providers/movie/abc`);
      assert.equal(resInvalidId.status, 400);
    });

    test("GET /tmdb/providers/:type/:id serves cached watch providers", async () => {
      const cacheKey = "providers:movie:777";
      const cachedProviders = {
        tmdbId: 777,
        link: "https://themoviedb.org/movie/777/watch",
        streaming: [{ providerId: 8, name: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w200/netflix.jpg" }],
        rent: [],
        buy: [],
      };
      tmdbProvidersCache.set(cacheKey, cachedProviders);

      const res = await fetch(`${baseUrl}/tmdb/providers/movie/777`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data, cachedProviders);
    });
  });

  describe("Import & Export formats", () => {
    test("POST /watchlist/import rejects invalid format with 400", async () => {
      const res = await fetch(`${baseUrl}/watchlist/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notAnArray: true }),
      });
      assert.equal(res.status, 400);
    });
  });
});
