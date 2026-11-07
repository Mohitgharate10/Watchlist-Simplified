# Contributing to Watchlist Simplified

Thank you for helping improve Watchlist Simplified. Contributions to the user experience, data model, API, tests, and documentation are welcome.

## Before contributing

- Search existing issues before opening a new one.
- For a sizable feature, describe the user problem and proposed approach in an issue first.
- Do not include database URLs, TMDB keys, or personal watchlist data in issues, commits, screenshots, or pull requests.

## Local setup

```bash
git clone https://github.com/<your-username>/Watchlist-Simplified.git
cd Watchlist-Simplified
pnpm install
```

Create a root `.env` with `DATABASE_URL`, `TMDB_API_KEY`, `PORT`, and `NODE_ENV`; see the [README](README.md) for example values. Then run:

```bash
pnpm db:push
pnpm typecheck
pnpm build
pnpm start
```

## Project structure

| Area | Responsibility |
| --- | --- |
| `artifacts/watchlist` | React client, pages, and UI components |
| `artifacts/api-server` | Express routes and TMDB service integration |
| `lib/db` | Drizzle schema and database access |
| `lib/api-zod` | Shared validation schemas |
| `lib/api-spec` | API contract definitions |
| `lib/api-client-react` | React Query client hooks |

When changing a database field, update the Drizzle schema, affected Zod validation, API contracts, and client behavior together.

## Contribution workflow

1. Create a focused branch from `main`: `feat/genre-filter` or `fix/poster-fallback`.
2. Make the smallest complete change.
3. Run `pnpm typecheck` and `pnpm build`.
4. Use a clear commit message, such as `feat(ui): add genre filters`.
5. Open a pull request with a summary, testing notes, linked issues, and screenshots for visible changes.

## Quality expectations

- Use strict TypeScript; avoid `any`.
- Validate API input before database access.
- Keep UI accessible, responsive, and consistent with the existing dark theme.
- Preserve TMDB attribution and comply with its terms.
- Keep secrets in local environment files only.

## Security reporting

Report suspected vulnerabilities or exposed credentials privately to the repository owner rather than in a public issue.

Happy watching and coding.
