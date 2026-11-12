import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  CreateItemBody,
  UpdateItemBody,
  ListItemsQueryParams,
  ImportWatchlistBody,
} from "@workspace/api-zod";

describe("Features Validation & Logic", () => {
  describe("Season and Episode Progress for Series", () => {
    test("CreateItemBody accepts seasonProgress and episodeProgress with defaults", () => {
      const validSeries = CreateItemBody.parse({
        title: "Breaking Bad",
        type: "series",
        seasonProgress: 2,
        episodeProgress: 7,
        totalSeasons: 5,
        totalEpisodes: 62,
      });

      assert.equal(validSeries.seasonProgress, 2);
      assert.equal(validSeries.episodeProgress, 7);
      assert.equal(validSeries.totalSeasons, 5);
      assert.equal(validSeries.totalEpisodes, 62);
    });

    test("UpdateItemBody allows partial progress updates", () => {
      const partialUpdate = UpdateItemBody.parse({
        episodeProgress: 8,
      });

      assert.equal(partialUpdate.episodeProgress, 8);
      assert.equal(partialUpdate.seasonProgress, undefined);
    });
  });

  describe("TMDB ID Storage & Duplicate Prevention", () => {
    test("CreateItemBody stores tmdbId as integer", () => {
      const movieWithTmdb = CreateItemBody.parse({
        title: "The Dark Knight",
        type: "movie",
        tmdbId: 155,
      });

      assert.equal(movieWithTmdb.tmdbId, 155);
    });
  });

  describe("Sorting, Searching & Pagination Params", () => {
    test("ListItemsQueryParams parses search, sortBy, sortOrder and page", () => {
      const parsed = ListItemsQueryParams.parse({
        search: "batman",
        sortBy: "year",
        sortOrder: "asc",
        page: 2,
        pageSize: 20,
      });

      assert.equal(parsed.search, "batman");
      assert.equal(parsed.sortBy, "year");
      assert.equal(parsed.sortOrder, "asc");
      assert.equal(parsed.page, 2);
      assert.equal(parsed.pageSize, 20);
    });

    test("ListItemsQueryParams applies default pagination and sorting", () => {
      const parsed = ListItemsQueryParams.parse({});

      assert.equal(parsed.sortBy, "updatedAt");
      assert.equal(parsed.sortOrder, "desc");
      assert.equal(parsed.page, 1);
      assert.equal(parsed.pageSize, 12);
    });
  });

  describe("Import & Export Data Parsing", () => {
    test("ImportWatchlistBody parses and validates array of titles", () => {
      const rawImportData = [
        {
          title: "Inception",
          type: "movie",
          year: 2010,
          tmdbId: 27205,
          rating: 9,
          status: "watched",
        },
        {
          title: "Severance",
          type: "series",
          year: 2022,
          tmdbId: 95557,
          seasonProgress: 1,
          episodeProgress: 9,
          status: "watching",
        },
      ];

      const validated = ImportWatchlistBody.parse(rawImportData);
      assert.equal(validated.length, 2);
      assert.equal(validated[0].title, "Inception");
      assert.equal(validated[1].type, "series");
      assert.equal(validated[1].episodeProgress, 9);
    });
  });
});
