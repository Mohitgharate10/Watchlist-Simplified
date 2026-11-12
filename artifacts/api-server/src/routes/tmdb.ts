import { Router } from "express";
import { SearchTmdbQueryParams, SearchTmdbResponse, GetWatchProvidersParams } from "@workspace/api-zod";
import { tmdbRateLimiter } from "../middlewares/rate-limit";
import { tmdbSearchCache, tmdbProvidersCache, tmdbDetailsCache } from "../lib/cache";

const router = Router();
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_LOGO_BASE_URL = "https://image.tmdb.org/t/p/w200";

const genreNames: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Sci-Fi",
  9648: "Mystery",
  10749: "Romance",
  10751: "Family",
  10752: "War",
  10759: "Action & Adventure",
  10762: "Kids",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  10770: "TV Movie",
};

export function isReadAccessToken(value: string): boolean {
  return value.startsWith("eyJ");
}

export function getTmdbHeaders(credential: string): { headers: Record<string, string>; appendApiKey?: string } {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (isReadAccessToken(credential)) {
    headers.Authorization = `Bearer ${credential}`;
    return { headers };
  }
  return { headers, appendApiKey: credential };
}

// Apply rate limiter to all TMDB proxy routes
router.use("/tmdb", tmdbRateLimiter);

router.get("/tmdb/search", async (req, res): Promise<void> => {
  const parsedQuery = SearchTmdbQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const { q, type } = parsedQuery.data;
  const cacheKey = `search:${type || "all"}:${q.trim().toLowerCase()}`;
  const cached = tmdbSearchCache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const credential = process.env.TMDB_API_KEY;
  if (!credential) {
    req.log.error("TMDB_API_KEY is not configured");
    res.status(503).json({ error: "TMDB integration is not configured" });
    return;
  }

  const endpoint = new URL(`${TMDB_BASE_URL}/search/multi`);
  endpoint.searchParams.set("query", q);
  endpoint.searchParams.set("include_adult", "false");
  endpoint.searchParams.set("language", "en-US");

  const { headers, appendApiKey } = getTmdbHeaders(credential);
  if (appendApiKey) {
    endpoint.searchParams.set("api_key", appendApiKey);
  }

  try {
    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      req.log.error({ status: response.status }, "TMDB search request failed");
      res.status(502).json({ error: "TMDB search request failed" });
      return;
    }

    const payload = (await response.json()) as {
      results?: Array<{
        id?: number;
        media_type?: string;
        title?: string;
        name?: string;
        release_date?: string;
        first_air_date?: string;
        poster_path?: string | null;
        overview?: string;
        genre_ids?: number[];
      }>;
    };

    const results = (payload.results ?? [])
      .filter((result) => result.media_type === "movie" || result.media_type === "tv")
      .filter((result) => !type || (type === "movie" ? result.media_type === "movie" : result.media_type === "tv"))
      .slice(0, 12)
      .map((result) => {
        const itemType = result.media_type === "tv" ? "series" : "movie";
        const date = result.media_type === "tv" ? result.first_air_date : result.release_date;
        const year = date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null;
        const genres = (result.genre_ids ?? [])
          .map((genreId) => genreNames[genreId])
          .filter(Boolean)
          .slice(0, 2)
          .join(", ");

        return {
          id: result.id ?? 0,
          title: result.title ?? result.name ?? "Untitled",
          type: itemType,
          year,
          posterUrl: result.poster_path ? `${TMDB_IMAGE_BASE_URL}${result.poster_path}` : null,
          description: result.overview || null,
          genre: genres || null,
        };
      })
      .filter((result) => result.id > 0);

    const validated = SearchTmdbResponse.parse(results);
    tmdbSearchCache.set(cacheKey, validated);
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Failed to search TMDB");
    res.status(502).json({ error: "TMDB search request failed" });
  }
});

router.get("/tmdb/providers/:type/:id", async (req, res): Promise<void> => {
  const parsedParams = GetWatchProvidersParams.safeParse({
    type: req.params.type,
    id: Number(req.params.id),
  });

  if (!parsedParams.success) {
    res.status(400).json({ error: "Invalid type or id parameters" });
    return;
  }

  const { type, id } = parsedParams.data;
  const tmdbType = type === "series" ? "tv" : "movie";
  const cacheKey = `providers:${tmdbType}:${id}`;
  const cached = tmdbProvidersCache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const credential = process.env.TMDB_API_KEY;
  if (!credential) {
    res.status(503).json({ error: "TMDB integration is not configured" });
    return;
  }

  const endpoint = new URL(`${TMDB_BASE_URL}/${tmdbType}/${id}/watch/providers`);
  const { headers, appendApiKey } = getTmdbHeaders(credential);
  if (appendApiKey) {
    endpoint.searchParams.set("api_key", appendApiKey);
  }

  try {
    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      if (response.status === 404) {
        res.status(404).json({ error: "Watch providers not found" });
        return;
      }
      res.status(502).json({ error: "Failed to fetch watch providers from TMDB" });
      return;
    }

    const data = (await response.json()) as {
      results?: Record<
        string,
        {
          link?: string;
          flatrate?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
          rent?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
          buy?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
        }
      >;
    };

    // Prefer US, fallback to first available region or empty
    const regionData = data.results?.US || (data.results ? Object.values(data.results)[0] : undefined);

    const mapProvider = (p: { provider_id: number; provider_name: string; logo_path?: string }) => ({
      providerId: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `${TMDB_LOGO_BASE_URL}${p.logo_path}` : null,
    });

    const result = {
      tmdbId: id,
      link: regionData?.link || null,
      streaming: (regionData?.flatrate || []).map(mapProvider),
      rent: (regionData?.rent || []).map(mapProvider),
      buy: (regionData?.buy || []).map(mapProvider),
    };

    tmdbProvidersCache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch watch providers");
    res.status(502).json({ error: "Failed to fetch watch providers" });
  }
});

// Helper for refreshing item details from TMDB
export async function fetchTmdbDetails(type: "movie" | "series", tmdbId: number) {
  const cacheKey = `details:${type}:${tmdbId}`;
  const cached = tmdbDetailsCache.get(cacheKey);
  if (cached) return cached;

  const credential = process.env.TMDB_API_KEY;
  if (!credential) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  const tmdbType = type === "series" ? "tv" : "movie";
  const endpoint = new URL(`${TMDB_BASE_URL}/${tmdbType}/${tmdbId}`);
  const { headers, appendApiKey } = getTmdbHeaders(credential);
  if (appendApiKey) {
    endpoint.searchParams.set("api_key", appendApiKey);
  }

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    genres?: Array<{ id: number; name: string }>;
    number_of_seasons?: number;
    number_of_episodes?: number;
  };

  const date = type === "series" ? data.first_air_date : data.release_date;
  const year = date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null;
  const genre = (data.genres || []).map((g) => g.name).slice(0, 2).join(", ") || null;

  const result = {
    title: data.title ?? data.name ?? "Untitled",
    description: data.overview || null,
    posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
    year,
    genre,
    totalSeasons: data.number_of_seasons || null,
    totalEpisodes: data.number_of_episodes || null,
  };

  tmdbDetailsCache.set(cacheKey, result);
  return result;
}

export default router;
