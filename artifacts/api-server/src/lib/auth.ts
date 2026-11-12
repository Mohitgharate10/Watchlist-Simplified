import crypto from "node:crypto";
import * as jose from "jose";

export interface UserTokenPayload {
  id: number;
  username: string;
  email: string;
}

let runtimeSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return new TextEncoder().encode(secret.trim());
  }

  if (!runtimeSecret) {
    // Generate a cryptographically secure 256-bit random key at runtime
    // This allows the app to boot cleanly without crashing even if JWT_SECRET was not added to Render's dashboard yet,
    // while guaranteeing tokens cannot be forged or guessed by an attacker.
    const randomHex = crypto.randomBytes(32).toString("hex");
    runtimeSecret = new TextEncoder().encode(randomHex);
    console.warn(
      "[auth] NOTICE: JWT_SECRET environment variable is not configured. Generated a cryptographically secure runtime key. User sessions will expire on restart. Set JWT_SECRET in your Render dashboard environment variables to persist sessions across deploys."
    );
  }
  return runtimeSecret;
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
