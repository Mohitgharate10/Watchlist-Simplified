import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set; skipping migrations.");
    return;
  }
  const isProduction = process.env.NODE_ENV === "production";
  const client = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      isProduction && !process.env.DATABASE_URL.includes("localhost")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const db = drizzle(client);
  console.log("Applying database migrations...");
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../drizzle") });
  console.log("Database migrations applied successfully.");
  await client.end();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}
