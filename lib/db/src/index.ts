import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/watchlist";
const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString,
  ssl:
    isProduction && !connectionString.includes("localhost")
      ? { rejectUnauthorized: false }
      : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
