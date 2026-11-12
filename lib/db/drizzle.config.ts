import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/watchlist.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
});
