# Contributing to Watchlist Simplified

Thank you for your interest in improving **Watchlist Simplified**! Whether you want to add support for new streaming metadata, design UI enhancements, or optimize API performance, your help is welcome.

---

## 📌 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Monorepo Workspace Structure](#monorepo-workspace-structure)
- [Local Development Setup](#local-development-setup)
- [Database Changes with Drizzle](#database-changes-with-drizzle)
- [Coding Guidelines](#coding-guidelines)
- [Pull Request Process](#pull-request-process)

---

## 🤝 Code of Conduct

Please maintain an inclusive, collaborative, and friendly space for all contributors. Respect differing viewpoints and offer constructive feedback.

---

## 💡 How Can I Contribute?

1. **Bug Reports**: Open an issue detailing the steps to reproduce, the expected behavior, and error messages.
2. **Feature Proposals**: Submit an issue outlining the idea (e.g., custom watchlist categories, export to CSV, user accounts).
3. **Pull Requests**: Tackle any open issue or propose an enhancement directly.

---

## 🏗️ Monorepo Workspace Structure

Watchlist Simplified is powered by `pnpm` workspaces:

- **`artifacts/watchlist`**: The React 19 client application (Vite, Tailwind, Radix UI, TanStack Query).
- **`artifacts/api-server`**: Express 5 application serving the REST API and communicating with TMDB.
- **`lib/db`**: Drizzle ORM schema definitions and database client.
- **`lib/api-zod`**: Shared Zod schemas ensuring end-to-end request/response validation.
- **`lib/api-spec`**: OpenAPI and routing specifications.
- **`lib/api-client-react`**: React query hooks and API client library.

---

## 🛠️ Local Development Setup

1. **Fork & Clone**
   ```bash
   git clone https://github.com/<your-username>/Watchlist-Simplified.git
   cd Watchlist-Simplified
   ```

2. **Branch Naming**
   ```bash
   git checkout -b feat/add-genre-filter
   # or
   git checkout -b fix/tmdb-poster-fallback
   ```

3. **Install Dependencies**
   ```bash
   pnpm install
   ```

4. **Environment Variables**
   Create a `.env` file at the root:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/watchlist
   TMDB_API_KEY=your_tmdb_api_key
   PORT=5000
   NODE_ENV=development
   ```

5. **Push Database Schema**
   ```bash
   pnpm run db:push
   ```

6. **Build & Test**
   ```bash
   # Typecheck shared libraries and artifacts
   pnpm run typecheck

   # Build all packages
   pnpm run build

   # Start the application
   pnpm run start
   ```

---

## 🗄️ Database Changes with Drizzle

When updating or introducing new database fields:
1. Modify schema definitions in `lib/db/src/schema/watchlist.ts`.
2. Update corresponding Zod schemas in `lib/api-zod` if inputs change.
3. Apply the changes locally using:
   ```bash
   pnpm run db:push
   ```
4. Verify TypeScript compilation:
   ```bash
   pnpm run typecheck:libs
   ```

---

## 📐 Coding Guidelines

- **TypeScript**: Strict type checking is enabled. Always declare proper types and avoid `any`.
- **UI & Styling**: Use Tailwind CSS and Radix UI primitives. Maintain dark mode contrast ratios and accessibility.
- **API Cleanliness**: Keep route logic modular in `artifacts/api-server/src/routes`. Validate payloads using Zod before interacting with the database.

---

## 🚀 Pull Request Process

1. Test your changes locally (`pnpm run typecheck` and `pnpm run build`).
2. Commit your code using clear, descriptive commit messages:
   ```bash
   git commit -m "feat(ui): add genre tag pills to watchlist item card"
   ```
3. Push to your branch:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a Pull Request against the `main` branch of `Mohitgharate10/Watchlist-Simplified`.
5. Describe your changes and link related issues.

---

Happy watching and coding! 🍿
