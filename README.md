# Watchlist Simplified

> A personal movie and series tracker with TMDB discovery, watch-status management, ratings, notes, and a dark-mode dashboard.

[Live application](https://watchlist-simplified.onrender.com/) · [Contributing](CONTRIBUTING.md)

## Features

- Search TMDB for films and series, then import artwork and metadata.
- Organize titles as **Want to Watch**, **Watching**, or **Watched**.
- Add personal ratings and private notes.
- Review watchlist totals, progress, and genre summaries.
- Use a responsive React interface backed by a type-safe Express API.

## Architecture

```text
artifacts/watchlist/   React 19 + Vite client
artifacts/api-server/  Express 5 API and TMDB integration
lib/db/                Drizzle ORM schema and PostgreSQL client
lib/api-zod/           Shared request and response validation
lib/api-spec/          Route and API contracts
lib/api-client-react/  React Query hooks and API client
```

## Stack

React 19, Vite, Tailwind CSS, Radix UI, TanStack Query, Express 5, Drizzle ORM, Zod, PostgreSQL, pnpm, and the [TMDB API](https://developer.themoviedb.org/docs).

## Run locally

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- A TMDB API key

### Setup

```bash
git clone https://github.com/Mohitgharate10/Watchlist-Simplified.git
cd Watchlist-Simplified
pnpm install
```

Create a root `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/watchlist
TMDB_API_KEY=your_tmdb_api_key
PORT=5000
NODE_ENV=development
```

Then initialize the database and start the project:

```bash
pnpm db:push
pnpm build
pnpm start
```

Open [http://localhost:5000](http://localhost:5000).

Keep `.env` out of source control. Use a least-privileged database user in deployed environments and rotate any key that is accidentally exposed.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm build` | Build shared libraries, client, and API |
| `pnpm start` | Start the compiled API server |
| `pnpm db:push` | Push the Drizzle schema to the database |
| `pnpm typecheck` | Type-check libraries and application artifacts |
| `pnpm typecheck:libs` | Type-check shared libraries only |

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check service health |
| `GET` / `POST` | `/api/items` | List or create watchlist items |
| `GET` / `PATCH` / `DELETE` | `/api/items/:id` | Read, update, or remove an item |
| `GET` | `/api/tmdb/search?q=:query` | Search TMDB |
| `GET` | `/api/tmdb/details/:id` | Retrieve title metadata |

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Follow the [TMDB terms of use](https://www.themoviedb.org/terms-of-use) when deploying or redistributing the application.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and pull-request checklist.

## License

Licensed under the [MIT License](LICENSE).
