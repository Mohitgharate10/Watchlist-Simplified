# 🎬 Watchlist

A personal film and series tracking application built with React, Vite, Express, PostgreSQL, and TMDB integration.

## ✨ Features
- **Dashboard & Statistics**: Track total titles, items in progress, completed, and watch status.
- **TMDB Integration**: Instant search across thousands of movies and TV series with automatic poster, year, and genre fetching.
- **Custom Notes & Ratings**: Add personal ratings, synopsis, and status (Want to Watch, Watching, Watched).
- **Responsive Design**: Optimized for mobile, tablet, and desktop with dark mode aesthetic.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Radix UI, TanStack Query, Lucide Icons
- **Backend**: Express 5, Node.js, Drizzle ORM
- **Database**: PostgreSQL
- **Hosting**: Render

## 🚀 Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Setup environment variables:**
   Create a `.env` file with:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/watchlist
   TMDB_API_KEY=your_tmdb_api_key
   PORT=5000
   ```

3. **Push database schema:**
   ```bash
   pnpm run db:push
   ```

4. **Run the build:**
   ```bash
   pnpm run build
   ```

5. **Start the application:**
   ```bash
   pnpm run start
   ```
