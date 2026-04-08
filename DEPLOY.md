# Deploy

## Prerequisites

- Node.js 18+ recommended.
- A Cloudflare account with Workers and D1 enabled.
- A Supabase project with a public Storage bucket named `portfolio`.
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

## 3. Configure Supabase Storage

- Use the existing public bucket name `portfolio`.
- The Worker uploads project files under `projects/...` and blog images under `blogs/...`.
- If you are using only `SUPABASE_ANON_KEY`, create Storage policies that allow the Worker to insert and delete objects in the `portfolio` bucket.

## 4. Configure Worker secrets and local vars

### Local development
- Copy [`.dev.vars.example`](/c:/laragon/www/portfolio/.dev.vars.example) to `.dev.vars`.
- Set:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `APP_URL`
  - `APP_DEBUG`
  - `SESSION_COOKIE_NAME`
  - `SESSION_TTL_MINUTES`
  - `COMMENTS_RATE_LIMIT_MAX`
  - `COMMENTS_RATE_LIMIT_WINDOW_SECONDS`

### Remote deployment secrets

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

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
- Upload the existing objects into the Supabase `portfolio` bucket using the same logical keys:
  - `projects/...`
  - `blogs/...`
- Existing rows that still store relative keys continue to work through the Worker compatibility routes.
- New uploads are stored as full public Supabase URLs in D1.

## 8. Local development

```bash
npm run dev
```

- Wrangler will serve the Worker locally.
- Static files are served from `public/`.
- Dynamic pages, auth, D1 access, and Supabase-backed file routes are handled by [src/index.ts](/c:/laragon/www/portfolio/src/index.ts).

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
- `SUPABASE_URL`: Supabase project URL secret.
- `SUPABASE_ANON_KEY`: Supabase key used for Storage API calls.

## Files to Review Before Deploy

- [wrangler.toml](/c:/laragon/www/portfolio/wrangler.toml)
- [migrations/0001_initial.sql](/c:/laragon/www/portfolio/migrations/0001_initial.sql)
- [src/index.ts](/c:/laragon/www/portfolio/src/index.ts)
- [src/lib/storage.ts](/c:/laragon/www/portfolio/src/lib/storage.ts)
- [src/views/pages.ts](/c:/laragon/www/portfolio/src/views/pages.ts)

## Official References

- D1 getting started: https://developers.cloudflare.com/d1/get-started/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Supabase JS install: https://supabase.com/docs/reference/javascript/installing
- Supabase Storage uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase Storage serving assets: https://supabase.com/docs/guides/storage/serving/downloads
