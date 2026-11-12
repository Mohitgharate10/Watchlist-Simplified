import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, createToken, verifyToken } from "../lib/auth";

describe("Authentication Utilities", () => {
  test("hashPassword generates salted hash and verifies correctly", async () => {
    const password = "mySecretPassword123!";
    const hash = await hashPassword(password);

    assert.ok(hash.includes(":"), "Hash must contain salt and key separated by colon");
    const valid = await verifyPassword(password, hash);
    assert.equal(valid, true, "Valid password should verify successfully");

    const invalid = await verifyPassword("wrongPassword", hash);
    assert.equal(invalid, false, "Invalid password should fail verification");
  });

  test("hashPassword produces different hashes for same password (salted)", async () => {
    const password = "samePassword";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    assert.notEqual(hash1, hash2, "Different salts must produce different hashes");
    assert.equal(await verifyPassword(password, hash1), true);
    assert.equal(await verifyPassword(password, hash2), true);
  });

  test("createToken and verifyToken work with valid payload", () => {
    const payload = { id: 42, username: "moviebuff", email: "buff@example.com" };
    const token = createToken(payload);

    assert.ok(typeof token === "string");
    assert.equal(token.split(".").length, 3, "JWT must have 3 dot-separated parts");

    const decoded = verifyToken(token);
    assert.deepEqual(decoded, payload);
  });

  test("verifyToken rejects tampered or malformed tokens", () => {
    const payload = { id: 1, username: "alice", email: "alice@test.com" };
    const token = createToken(payload);

    // Tamper with payload
    const parts = token.split(".");
    const tampered = `${parts[0]}.eyJhZG1pbiI6dHJ1ZX0.${parts[2]}`;
    assert.equal(verifyToken(tampered), null);

    // Completely invalid string
    assert.equal(verifyToken("invalid.token"), null);
    assert.equal(verifyToken(""), null);
  });

  test("verifyToken rejects expired tokens", () => {
    const payload = { id: 99, username: "expired", email: "exp@test.com" };
    // Token that expired 10 seconds ago
    const expiredToken = createToken(payload, -10);
    assert.equal(verifyToken(expiredToken), null);
  });
});
