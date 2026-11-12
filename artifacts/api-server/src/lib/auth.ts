import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "watchlist-secret-key-change-in-production";

export interface UserTokenPayload {
  id: number;
  username: string;
  email: string;
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

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

export function createToken(payload: UserTokenPayload, expiresInSeconds = 7 * 24 * 3600): string {
  const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = JSON.stringify({ ...payload, exp });

  const encodedHeader = base64UrlEncode(header);
  const encodedBody = base64UrlEncode(body);
  const message = `${encodedHeader}.${encodedBody}`;

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(message)
    .digest("base64url");

  return `${message}.${signature}`;
}

export function verifyToken(token: string): UserTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedBody, signature] = parts;
    const message = `${encodedHeader}.${encodedBody}`;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(message)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedBody)) as UserTokenPayload & { exp?: number };
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
