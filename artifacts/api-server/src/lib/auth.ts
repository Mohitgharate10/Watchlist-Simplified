import crypto from "node:crypto";
import * as jose from "jose";

export interface UserTokenPayload {
  id: number;
  username: string;
  email: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: JWT_SECRET environment variable is missing. It must be set in production to prevent token forgery."
      );
    }
    return new TextEncoder().encode("dev-insecure-fallback-secret-key-1234567890");
  }
  return new TextEncoder().encode(secret);
}

// Fail fast in production if JWT_SECRET is not configured
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is missing. It must be set in production to prevent token forgery."
  );
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      try {
        const keyBuffer = Buffer.from(key, "hex");
        const match = crypto.timingSafeEqual(keyBuffer, derivedKey);
        resolve(match);
      } catch {
        resolve(false);
      }
    });
  });
}

export async function createToken(payload: UserTokenPayload, expiresIn = "7d"): Promise<string> {
  const secret = getJwtSecret();
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<UserTokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    if (!payload.id || !payload.username || !payload.email) {
      return null;
    }
    return {
      id: Number(payload.id),
      username: String(payload.username),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}
