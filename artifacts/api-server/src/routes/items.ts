import { Router } from "express";
import { db, watchlistItems } from "@workspace/db";
import { eq, desc, asc, and, or, count, avg, ilike } from "drizzle-orm";
import {
  CreateItemBody,
  UpdateItemBody,
  ListItemsQueryParams,
  GetItemParams,
  UpdateItemParams,
  DeleteItemParams,
  GetRecentItemsQueryParams,
  RefreshItemFromTmdbParams,
  ImportWatchlistBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { fetchTmdbDetails } from "./tmdb";

const router = Router();

function parseNumericId(idParam: string | string[] | undefined): number | null {
  const val = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!val) return null;
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

// ---------------------------------------------------------------------------
// 1. GET /items/recent (requires auth; strictly scoped to user)
// ---------------------------------------------------------------------------
router.get("/items/recent", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetRecentItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
    return;
  }

  const limit = parsed.data.limit ?? 6;
  const userId = req.user!.id;

  try {
    const items = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .orderBy(desc(watchlistItems.updatedAt))
      .limit(limit);

    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent items");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 2. GET /items (requires auth; search, filter, sort, and pagination scoped to user)
// ---------------------------------------------------------------------------
router.get("/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
    return;
  }

  const query = parsed.data;
  const userId = req.user!.id;
  const conditions = [eq(watchlistItems.userId, userId)];

  if (query.status) {
    conditions.push(eq(watchlistItems.status, query.status as "want_to_watch" | "watching" | "watched"));
  }
  if (query.type) {
    conditions.push(eq(watchlistItems.type, query.type as "movie" | "series"));
  }
  if (query.genre) {
    conditions.push(eq(watchlistItems.genre, query.genre));
  }
  if (query.search && query.search.trim().length > 0) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(
        ilike(watchlistItems.title, term),
        ilike(watchlistItems.genre, term),
        ilike(watchlistItems.description, term),
        ilike(watchlistItems.notes, term)
      )!
    );
  }

  const whereClause = and(...conditions);

  // Sorting
  const sortBy = query.sortBy ?? "updatedAt";
  const sortOrder = query.sortOrder ?? "desc";
  const sortColumn = {
    updatedAt: watchlistItems.updatedAt,
    createdAt: watchlistItems.createdAt,
    title: watchlistItems.title,
    year: watchlistItems.year,
    rating: watchlistItems.rating,
  }[sortBy] ?? watchlistItems.updatedAt;

  const orderClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  // Pagination
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 12));
  const offset = (page - 1) * pageSize;

  try {
    // SQL count aggregate for total
    const [totalRow] = await db
      .select({ count: count() })
      .from(watchlistItems)
      .where(whereClause);

    const total = Number(totalRow?.count ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    const items = await db
      .select()
      .from(watchlistItems)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(pageSize)
      .offset(offset);

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list items");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 3. POST /items (requires auth; creates item; prevents duplicates; returns 500 on DB failure)
// ---------------------------------------------------------------------------
router.post("/items", requireAuth, async (req, res): Promise<void> => {
  const parseResult = CreateItemBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid item data", details: parseResult.error.flatten() });
    return;
  }

  const body = parseResult.data;
  const userId = req.user!.id;

  try {
    // Check if duplicate tmdbId exists for this user
    if (body.tmdbId) {
      const existing = await db
        .select()
        .from(watchlistItems)
        .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, body.tmdbId)))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({
          error: "This title is already in your watchlist",
          existingItem: existing[0],
        });
        return;
      }
    }

    const [item] = await db
      .insert(watchlistItems)
      .values({
        userId,
        tmdbId: body.tmdbId ?? null,
        title: body.title,
        type: body.type as "movie" | "series",
        genre: body.genre,
        year: body.year,
        posterUrl: body.posterUrl,
        description: body.description,
        status: (body.status ?? "want_to_watch") as "want_to_watch" | "watching" | "watched",
        rating: body.rating,
        notes: body.notes,
        seasonProgress: body.seasonProgress ?? (body.type === "series" ? 1 : 0),
        episodeProgress: body.episodeProgress ?? 0,
        totalSeasons: body.totalSeasons,
        totalEpisodes: body.totalEpisodes,
      })
      .returning();

    res.status(201).json(item);
  } catch (err: any) {
    // Catch database unique index constraint violation (race conditions)
    if (err?.code === "23505") {
      res.status(409).json({ error: "This title is already in your watchlist" });
      return;
    }
    req.log.error({ err }, "Failed to create item in database");
    res.status(500).json({ error: "Database error while creating item" });
  }
});

// ---------------------------------------------------------------------------
// 4. GET /items/:id (requires auth; 400 on bad id, 404 on not found)
// ---------------------------------------------------------------------------
router.get("/items/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseNumericId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid item ID. Must be a positive integer." });
    return;
  }

  const userId = req.user!.id;

  try {
    const [item] = await db
      .select()
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.id, id)));

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to get item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 5. PATCH /items/:id (requires auth; 400 on bad input; 404 on missing)
// ---------------------------------------------------------------------------
router.patch("/items/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseNumericId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid item ID. Must be a positive integer." });
    return;
  }

  const parseResult = UpdateItemBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid update data", details: parseResult.error.flatten() });
    return;
  }

  const body = parseResult.data;
  const userId = req.user!.id;

  try {
    const [item] = await db
      .update(watchlistItems)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.type !== undefined && { type: body.type as "movie" | "series" }),
        ...(body.genre !== undefined && { genre: body.genre }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.posterUrl !== undefined && { posterUrl: body.posterUrl }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status as "want_to_watch" | "watching" | "watched" }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.tmdbId !== undefined && { tmdbId: body.tmdbId }),
        ...(body.seasonProgress !== undefined && { seasonProgress: body.seasonProgress }),
        ...(body.episodeProgress !== undefined && { episodeProgress: body.episodeProgress }),
        ...(body.totalSeasons !== undefined && { totalSeasons: body.totalSeasons }),
        ...(body.totalEpisodes !== undefined && { totalEpisodes: body.totalEpisodes }),
        updatedAt: new Date(),
      })
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.id, id)))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(item);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "This title is already in your watchlist" });
      return;
    }
    req.log.error({ err }, "Failed to update item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 6. DELETE /items/:id (requires auth; 400 on bad id, 404 on missing, 204 on success)
// ---------------------------------------------------------------------------
router.delete("/items/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseNumericId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid item ID. Must be a positive integer." });
    return;
  }

  const userId = req.user!.id;

  try {
    const deleted = await db
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.id, id)))
      .returning({ id: watchlistItems.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 7. POST /items/:id/refresh (requires auth; refreshes metadata from TMDB)
// ---------------------------------------------------------------------------
router.post("/items/:id/refresh", requireAuth, async (req, res): Promise<void> => {
  const id = parseNumericId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid item ID. Must be a positive integer." });
    return;
  }

  const userId = req.user!.id;

  try {
    const [item] = await db
      .select()
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.id, id)));

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    if (!item.tmdbId) {
      res.status(400).json({ error: "Item does not have an associated TMDB ID to refresh" });
      return;
    }

    let tmdbData;
    try {
      tmdbData = await fetchTmdbDetails(item.type, item.tmdbId);
    } catch (tmdbErr) {
      req.log.error({ tmdbErr }, "Failed to fetch from TMDB during item refresh");
      res.status(502).json({ error: "Failed to fetch updated information from TMDB" });
      return;
    }

    const [updated] = await db
      .update(watchlistItems)
      .set({
        title: tmdbData.title,
        description: tmdbData.description ?? item.description,
        posterUrl: tmdbData.posterUrl ?? item.posterUrl,
        year: tmdbData.year ?? item.year,
        genre: tmdbData.genre ?? item.genre,
        ...(tmdbData.totalSeasons ? { totalSeasons: tmdbData.totalSeasons } : {}),
        ...(tmdbData.totalEpisodes ? { totalEpisodes: tmdbData.totalEpisodes } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.id, id)))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to refresh item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 8. GET /stats (requires auth; SQL aggregates: count, avg, group by scoped to user)
// ---------------------------------------------------------------------------
router.get("/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const userCond = eq(watchlistItems.userId, userId);

  try {
    // 1. Overall total and average rating via SQL aggregate
    const [overall] = await db
      .select({
        total: count(),
        averageRating: avg(watchlistItems.rating),
      })
      .from(watchlistItems)
      .where(userCond);

    // 2. Count grouped by status via SQL aggregate
    const statusRows = await db
      .select({
        status: watchlistItems.status,
        count: count(),
      })
      .from(watchlistItems)
      .where(userCond)
      .groupBy(watchlistItems.status);

    // 3. Count grouped by type via SQL aggregate
    const typeRows = await db
      .select({
        type: watchlistItems.type,
        count: count(),
      })
      .from(watchlistItems)
      .where(userCond)
      .groupBy(watchlistItems.type);

    const byStatus = {
      want_to_watch: 0,
      watching: 0,
      watched: 0,
    };
    for (const row of statusRows) {
      if (row.status in byStatus) {
        byStatus[row.status as keyof typeof byStatus] = Number(row.count);
      }
    }

    const byType = {
      movie: 0,
      series: 0,
    };
    for (const row of typeRows) {
      if (row.type in byType) {
        byType[row.type as keyof typeof byType] = Number(row.count);
      }
    }

    const rawAvg = overall?.averageRating ? Number(overall.averageRating) : null;
    const averageRating = rawAvg !== null ? Math.round(rawAvg * 10) / 10 : null;

    res.json({
      total: Number(overall?.total ?? 0),
      byStatus,
      byType,
      averageRating,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 9. GET /watchlist/export (requires auth; strictly scoped to user)
// ---------------------------------------------------------------------------
router.get("/watchlist/export", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  try {
    const items = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .orderBy(desc(watchlistItems.createdAt));

    res.setHeader("Content-Disposition", 'attachment; filename="watchlist-export.json"');
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to export watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// 10. POST /watchlist/import (requires auth; transactional; capped at 500 items)
// ---------------------------------------------------------------------------
router.post("/watchlist/import", requireAuth, async (req, res): Promise<void> => {
  const parseResult = ImportWatchlistBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid import format", details: parseResult.error.flatten() });
    return;
  }

  const itemsToImport = parseResult.data;
  if (itemsToImport.length > 500) {
    res.status(400).json({ error: "Import exceeds maximum limit of 500 items" });
    return;
  }

  const userId = req.user!.id;

  try {
    const importResult = await db.transaction(async (tx) => {
      // Get existing items for this user to check duplicates within transaction
      const existing = await tx
        .select({ tmdbId: watchlistItems.tmdbId, title: watchlistItems.title })
        .from(watchlistItems)
        .where(eq(watchlistItems.userId, userId));

      const existingTmdbIds = new Set(existing.map((e) => e.tmdbId).filter(Boolean));
      const existingTitles = new Set(existing.map((e) => e.title.toLowerCase()));

      let imported = 0;
      let skipped = 0;

      for (const item of itemsToImport) {
        if (item.tmdbId && existingTmdbIds.has(item.tmdbId)) {
          skipped++;
          continue;
        }
        if (!item.tmdbId && existingTitles.has(item.title.toLowerCase())) {
          skipped++;
          continue;
        }

        await tx.insert(watchlistItems).values({
          userId,
          tmdbId: item.tmdbId ?? null,
          title: item.title,
          type: item.type as "movie" | "series",
          genre: item.genre,
          year: item.year,
          posterUrl: item.posterUrl,
          description: item.description,
          status: (item.status ?? "want_to_watch") as "want_to_watch" | "watching" | "watched",
          rating: item.rating,
          notes: item.notes,
          seasonProgress: item.seasonProgress ?? (item.type === "series" ? 1 : 0),
          episodeProgress: item.episodeProgress ?? 0,
          totalSeasons: item.totalSeasons,
          totalEpisodes: item.totalEpisodes,
        });

        if (item.tmdbId) existingTmdbIds.add(item.tmdbId);
        existingTitles.add(item.title.toLowerCase());
        imported++;
      }

      return {
        imported,
        skipped,
        total: itemsToImport.length,
      };
    });

    res.json(importResult);
  } catch (err) {
    req.log.error({ err }, "Failed to import watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
