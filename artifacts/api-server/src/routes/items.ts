import { Router } from "express";
import { db } from "@workspace/db";
import { watchlistItems } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateItemBody,
  UpdateItemBody,
  ListItemsQueryParams,
  GetItemParams,
  UpdateItemParams,
  DeleteItemParams,
  GetRecentItemsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/items/recent", async (req, res) => {
  try {
    const query = GetRecentItemsQueryParams.parse(req.query);
    const limit = query.limit ?? 6;
    const items = await db
      .select()
      .from(watchlistItems)
      .orderBy(desc(watchlistItems.updatedAt))
      .limit(limit);
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent items");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/items", async (req, res) => {
  try {
    const query = ListItemsQueryParams.parse(req.query);

    const conditions = [];
    if (query.status) {
      conditions.push(eq(watchlistItems.status, query.status as "want_to_watch" | "watching" | "watched"));
    }
    if (query.type) {
      conditions.push(eq(watchlistItems.type, query.type as "movie" | "series"));
    }
    if (query.genre) {
      conditions.push(eq(watchlistItems.genre, query.genre));
    }

    const items = conditions.length > 0
      ? await db.select().from(watchlistItems).where(and(...conditions)).orderBy(desc(watchlistItems.updatedAt))
      : await db.select().from(watchlistItems).orderBy(desc(watchlistItems.updatedAt));

    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to list items");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/items", async (req, res) => {
  try {
    const body = CreateItemBody.parse(req.body);
    const [item] = await db
      .insert(watchlistItems)
      .values({
        title: body.title,
        type: body.type as "movie" | "series",
        genre: body.genre,
        year: body.year,
        posterUrl: body.posterUrl,
        description: body.description,
        status: (body.status ?? "want_to_watch") as "want_to_watch" | "watching" | "watched",
        rating: body.rating,
        notes: body.notes,
      })
      .returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to create item");
    res.status(400).json({ error: "Bad request" });
  }
});

router.get("/items/:id", async (req, res): Promise<void> => {
  try {
    const { id } = GetItemParams.parse({ id: Number(req.params.id) });
    const [item] = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.id, id));
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to get item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/items/:id", async (req, res): Promise<void> => {
  try {
    const { id } = UpdateItemParams.parse({ id: Number(req.params.id) });
    const body = UpdateItemBody.parse(req.body);
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
        updatedAt: new Date(),
      })
      .where(eq(watchlistItems.id, id))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to update item");
    res.status(400).json({ error: "Bad request" });
  }
});

router.delete("/items/:id", async (req, res) => {
  try {
    const { id } = DeleteItemParams.parse({ id: Number(req.params.id) });
    await db.delete(watchlistItems).where(eq(watchlistItems.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const allItems = await db.select().from(watchlistItems);
    const total = allItems.length;
    const byStatus: Record<string, number> = { want_to_watch: 0, watching: 0, watched: 0 };
    const byType: Record<string, number> = { movie: 0, series: 0 };
    let ratingSum = 0;
    let ratingCount = 0;

    for (const item of allItems) {
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      byType[item.type] = (byType[item.type] ?? 0) + 1;
      if (item.rating !== null && item.rating !== undefined) {
        ratingSum += item.rating;
        ratingCount++;
      }
    }

    res.json({
      total,
      byStatus,
      byType,
      averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
