import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const itemTypeEnum = pgEnum("item_type", ["movie", "series"]);
export const itemStatusEnum = pgEnum("item_status", ["want_to_watch", "watching", "watched"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  tmdbId: integer("tmdb_id"),
  title: text("title").notNull(),
  type: itemTypeEnum("type").notNull(),
  genre: text("genre"),
  year: integer("year"),
  posterUrl: text("poster_url"),
  description: text("description"),
  status: itemStatusEnum("status").notNull().default("want_to_watch"),
  rating: integer("rating"),
  notes: text("notes"),
  seasonProgress: integer("season_progress").notNull().default(1),
  episodeProgress: integer("episode_progress").notNull().default(0),
  totalSeasons: integer("total_seasons"),
  totalEpisodes: integer("total_episodes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWatchlistItemSchema = insertWatchlistItemSchema.partial();

export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type UpdateWatchlistItem = z.infer<typeof updateWatchlistItemSchema>;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
