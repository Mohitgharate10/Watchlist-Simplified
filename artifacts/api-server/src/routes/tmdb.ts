import { Router } from "express";
import { SearchTmdbQueryParams, SearchTmdbResponse } from "@workspace/api-zod";

const router = Router();
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

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

function isReadAccessToken(value: string): boolean {
  return value.startsWith("eyJ");
}

router.get("/tmdb/search", async (req, res): Promise<void> => {
  const parsedQuery = SearchTmdbQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const credential = process.env.TMDB_API_KEY;
  if (!credential) {
    req.log.error("TMDB_API_KEY is not configured");
    res.status(503).json({ error: "TMDB integration is not configured" });
    return;
  }

  const { q, type } = parsedQuery.data;
  const endpoint = new URL(`${TMDB_BASE_URL}/search/multi`);
  endpoint.searchParams.set("query", q);
  endpoint.searchParams.set("include_adult", "false");
  endpoint.searchParams.set("language", "en-US");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (isReadAccessToken(credential)) {
    headers.Authorization = `Bearer ${credential}`;
  } else {
    endpoint.searchParams.set("api_key", credential);
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

    res.json(SearchTmdbResponse.parse(results));
  } catch (err) {
    req.log.error({ err }, "Failed to search TMDB");
    res.status(502).json({ error: "TMDB search request failed" });
  }
});

export default router;