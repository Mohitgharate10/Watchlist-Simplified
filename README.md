# Watchlist Simplified

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TMDB API](https://img.shields.io/badge/TMDB-API_v3-01D277?logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Render-success)](https://watchlist-simplified.onrender.com/)

> **A personal film and television series tracking application with instant TMDB metadata lookup, custom ratings, watch progress analytics, and a dark-mode dashboard.**

[Live Application](https://watchlist-simplified.onrender.com/) • [Features](#features) • [Local Development](#local-development-setup) • [Monorepo Architecture](#monorepo-architecture) • [Contributing](CONTRIBUTING.md)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#features)
- [Monorepo Architecture](#monorepo-architecture)
- [Directory Structure](#directory-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [API Reference](#api-reference)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Keeping track of movies and TV shows across streaming platforms can quickly become disorganized. **Watchlist Simplified** offers a unified catalog where cinema enthusiasts can curate their watch history, queue upcoming releases, and log personal ratings.

With native **The Movie Database (TMDB)** integration, users can search any title to automatically populate high-resolution movie posters, synopses, genres, and release years with zero manual data entry.

---

## Features

- **Real-Time TMDB Search**: Instantly query hundreds of thousands of films and TV series directly from the TMDB API.
- **Automated Metadata Extraction**: Automatically imports official movie posters, genres, overview descriptions, and release years.
- **Lifecycle Status Tracking**: Categorize titles into **Want to Watch**, **Watching**, and **Watched**.
- **Personal Ratings and Notes**: Assign custom 1–10 star ratings and record private review notes for each entry.
- **Dashboard and Metrics**: Visual breakdown of total entries, completed titles, watch progress, and favorite genres.
- **Modern Dark Aesthetic**: Responsive interface built with Radix UI, Tailwind CSS, Lucide Icons, and accessible controls.
- **Type-Safe Full-Stack**: End-to-end type safety spanning PostgreSQL schema, Drizzle ORM, Zod validation, and React components.

---

## Monorepo Architecture

```mermaid
flowchart TD
    Browser["Client Browser (React 19 + TanStack Query)"]

    subgraph ClientPkg ["artifacts/watchlist"]
        UI["Tailwind UI & Radix Primitives"]
        Dialogs["Add Item / TMDB Search Modal"]
        Views["Home, Detail, & Catalog Views"]
    end

    subgraph ServerPkg ["artifacts/api-server"]
        Router["Express 5 Router (/api)"]
        TMDBService["TMDB Proxy & Search Engine"]
        ItemHandler["Watchlist Items Controller"]
    end

    subgraph CoreLibs ["lib/ Packages"]
        DbLib["lib/db (Drizzle ORM & Postgres Schema)"]
        ZodLib["lib/api-zod (Shared Zod Validation)"]
        SpecLib["lib/api-spec (OpenAPI / Route Contracts)"]
        ClientLib["lib/api-client-react (React Query Hooks)"]
    end

    subgraph External ["External Services"]
        PG[(PostgreSQL Database)]
        TMDB["The Movie Database (TMDB) API"]
    end

    Browser --> UI
    UI --> Dialogs
    UI --> Views
    Views --> ClientLib
    ClientLib --> Router

    Router --> TMDBService
    Router --> ItemHandler
    ItemHandler --> ZodLib
    ItemHandler --> DbLib
    DbLib --> PG
    TMDBService --> TMDB
```

---

## Directory Structure

```text
Watchlist-Simplified/
├── artifacts/
│   ├── watchlist/             # Frontend React 19 + Vite application with Tailwind CSS
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components (item cards, status badge, search dialog)
│   │   │   ├── pages/         # Routes (home dashboard, item detail, catalog view)
│   │   │   └── ui/            # Radix UI and shadcn primitives
│   │   └── vite.config.ts
│   ├── api-server/            # Express 5 backend server
│   │   └── src/
│   │       ├── routes/        # /api/items, /api/tmdb, /api/health
│   │       └── app.ts         # Server configuration
│   └── mockup-sandbox/        # UI component preview sandbox
├── lib/
│   ├── db/                    # Drizzle ORM PostgreSQL schema & migration configurations
│   ├── api-zod/               # Zod validation schemas for requests and payloads
│   ├── api-spec/              # API contract definitions
│   └── api-client-react/      # Generated React query hooks for front-end consumption
├── screenshots/               # Application preview media
├── render.yaml                # Render cloud deployment blueprint
├── pnpm-workspace.yaml        # Monorepo workspaces definition
└── package.json               # Monorepo orchestration scripts
```

---

## Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **State & Data Fetching**: [TanStack Query](https://tanstack.com/query)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express 5](https://expressjs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/) & [Drizzle-Zod](https://orm.drizzle.team/docs/zod)

### Database & External APIs
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Movie API**: [TMDB (The Movie Database) API v3](https://developer.themoviedb.org/docs)
- **Deployment**: [Render](https://render.com/)

---

## Prerequisites

Before you begin, ensure you have:
- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0`
- A [PostgreSQL](https://www.postgresql.org/) database (local or hosted)
- A free [TMDB API Key](https://www.themoviedb.org/settings/api)

---

## Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Mohitgharate10/Watchlist-Simplified.git
cd Watchlist-Simplified
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Setup environment variables
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/watchlist
TMDB_API_KEY=your_tmdb_api_key_here
PORT=5000
NODE_ENV=development
```

### 4. Push database schema
Synchronize your Drizzle ORM schema with the PostgreSQL database:
```bash
pnpm run db:push
```

### 5. Build workspaces
```bash
pnpm run build
```

### 6. Start the server
```bash
pnpm run start
```

Visit [http://localhost:5000](http://localhost:5000) in your browser.

---

## Database Management

Database schemas are defined in `lib/db/src/schema/watchlist.ts`.

```bash
# Push schema changes to your database without generating migrations
pnpm run db:push

# Generate Drizzle migration files
pnpm --filter @workspace/db run generate

# Run TypeScript typechecks across libraries
pnpm run typecheck:libs
```

### Schema Overview: watchlist_items
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `serial` | Primary Key | Auto-incrementing identifier |
| `title` | `text` | NOT NULL | Movie or series title |
| `type` | `enum('movie', 'series')` | NOT NULL | Media format |
| `genre` | `text` | Nullable | Primary genre or comma-delimited tags |
| `year` | `integer` | Nullable | Release year |
| `poster_url` | `text` | Nullable | TMDB poster image URL |
| `description` | `text` | Nullable | Synopsis or plot summary |
| `status` | `enum('want_to_watch', 'watching', 'watched')` | NOT NULL | Current viewing state |
| `rating` | `integer` | Nullable | User score (1 to 10) |
| `notes` | `text` | Nullable | Personal user notes or review |
| `created_at` | `timestamp` | NOT NULL | Record creation date |
| `updated_at` | `timestamp` | NOT NULL | Record last updated date |

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/items` | Retrieve all watchlist items (optional status/type filter) |
| `POST` | `/api/items` | Add a new title to the watchlist |
| `GET` | `/api/items/:id` | Fetch specific item details by ID |
| `PATCH` | `/api/items/:id` | Update watch status, rating, or personal notes |
| `DELETE` | `/api/items/:id` | Remove a title from the watchlist |
| `GET` | `/api/tmdb/search?q=:query` | Search TMDB catalog for movies and TV series |
| `GET` | `/api/tmdb/details/:id` | Fetch complete TMDB metadata for a selected title |

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `pnpm install` | Installs dependencies across all workspaces |
| `pnpm run build` | Builds TypeScript libraries, Vite UI, and Express API server |
| `pnpm run start` | Boots the compiled production Express server |
| `pnpm run db:push` | Pushes Drizzle database schema to the PostgreSQL database |
| `pnpm run typecheck` | Validates TypeScript types across all artifacts and libraries |
| `pnpm run typecheck:libs` | Validates TypeScript compilation inside the `lib/` directory |

---

## Contributing

Contributions, feature ideas, and pull requests are welcome. Please see our [Contributing Guide](CONTRIBUTING.md) for details on setting up your local environment and submitting changes.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more information.

---

<p align="center">
  Maintained by <a href="https://github.com/Mohitgharate10">Mohit Gharate</a>
</p>
