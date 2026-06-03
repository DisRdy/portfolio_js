# Deploy

## Prerequisites

- Node.js 18+ recommended.
- A Cloudflare account with Workers and D1 enabled.
- A Cloudflare R2 bucket named `portfolio`.
- Wrangler installed through project dependencies after `npm install`.

## 1. Install dependencies

```bash
npm install
```

## 2. Create the D1 database

```bash
npx wrangler d1 create portfolio-db
```

- Copy the returned `database_id` into [wrangler.toml](/c:/laragon/www/portfolio/wrangler.toml).
- Keep `binding = "DB"` so the Worker code continues to use `env.DB`.

## 3. Configure Cloudflare R2 Storage

- Create an R2 bucket named `portfolio`:

```bash
npx wrangler r2 bucket create portfolio
```

- Keep the `STORAGE` binding in [wrangler.toml](/c:/laragon/www/portfolio/wrangler.toml).
- The Worker uploads project files under `projects/...` and blog images under `blogs/...`.

## 4. Configure local vars

### Local development
- Copy [`.dev.vars.example`](/c:/laragon/www/portfolio/.dev.vars.example) to `.dev.vars`.
- Set:
  - `APP_URL`
  - `APP_DEBUG`
  - `SESSION_COOKIE_NAME`
  - `SESSION_TTL_MINUTES`
  - `COMMENTS_RATE_LIMIT_MAX`
  - `COMMENTS_RATE_LIMIT_WINDOW_SECONDS`

## 5. Apply D1 migrations locally

```bash
npm run d1:migrate:local
```

## 6. Apply D1 migrations remotely

```bash
npm run d1:migrate:remote
```

## 7. Load existing data

### Database data
- Export the current SQLite data from `database/database.sqlite`.
- Import it into D1 with Wrangler SQL execution or your preferred migration pipeline.

### File data
- Upload the existing objects into the R2 `portfolio` bucket using the same logical keys:
  - `projects/...`
  - `blogs/...`
- Existing rows that still store relative keys or legacy Supabase public URLs continue to work if the matching object key exists in R2.
- New uploads are stored as `/storage/...` Worker URLs in D1.

## 8. Local development

```bash
npm run dev
```

- Wrangler will serve the Worker locally.
- Static files are served from `public/`.
- Dynamic pages, auth, D1 access, and R2-backed file routes are handled by [src/index.ts](/c:/laragon/www/portfolio/src/index.ts).

## 9. Deploy to Cloudflare Workers

```bash
npm run deploy
```

## 10. Useful Wrangler commands

```bash
npx wrangler d1 migrations apply DB --local
npx wrangler d1 migrations apply DB --remote
npx wrangler d1 execute DB --local --command "SELECT * FROM users;"
npx wrangler d1 execute DB --remote --command "SELECT * FROM users;"
```

## Binding Summary

- `DB`: D1 database binding.
- `ASSETS`: Workers static asset binding for `public/`.
- `STORAGE`: R2 bucket binding for uploaded files.

## Files to Review Before Deploy

- [wrangler.toml](/c:/laragon/www/portfolio/wrangler.toml)
- [migrations/0001_initial.sql](/c:/laragon/www/portfolio/migrations/0001_initial.sql)
- [src/index.ts](/c:/laragon/www/portfolio/src/index.ts)
- [src/lib/storage.ts](/c:/laragon/www/portfolio/src/lib/storage.ts)
- [src/views/pages.ts](/c:/laragon/www/portfolio/src/views/pages.ts)

## Official References

- D1 getting started: https://developers.cloudflare.com/d1/get-started/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- R2 Workers API: https://developers.cloudflare.com/r2/get-started/workers-api/
- R2 pricing: https://developers.cloudflare.com/r2/pricing/
