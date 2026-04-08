# Deploy

## Prerequisites

- Node.js 18+ recommended.
- A Cloudflare account with Workers, D1, and R2 enabled.
- Wrangler installed through project dependencies after `npm install`.

## 1. Install dependencies

```bash
npm install
```

## 2. Create the D1 database

```bash
npx wrangler d1 create portfolio-db
```

- Copy the returned `database_id` into [`wrangler.toml`](/c:/laragon/www/portfolio/wrangler.toml).
- Keep `binding = "DB"` so the Worker code continues to use `env.DB`.

## 3. Create the R2 bucket

```bash
npx wrangler r2 bucket create portfolio-uploads
```

- Update [`wrangler.toml`](/c:/laragon/www/portfolio/wrangler.toml) if you choose a different bucket name.
- Keep `binding = "UPLOADS"` so the Worker code continues to use `env.UPLOADS`.

## 4. Prepare local environment variables

- Copy [`.dev.vars.example`](/c:/laragon/www/portfolio/.dev.vars.example) to `.dev.vars`.
- Adjust values if needed:
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
- Upload the existing objects under:
  - `storage/app/public/projects/...`
  - `storage/app/public/blogs/...`
- Use the same object keys in R2 so the migrated rows keep working unchanged.

## 8. Local development

```bash
npm run dev
```

- Wrangler will serve the Worker locally.
- Static files are served from `public/`.
- Dynamic pages, auth, D1 access, and R2-backed file routes are handled by `src/index.ts`.

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
- `UPLOADS`: R2 bucket binding for project files and blog images.
- `ASSETS`: Workers static asset binding for `public/`.

## Files to Review Before Deploy

- [`wrangler.toml`](/c:/laragon/www/portfolio/wrangler.toml)
- [`migrations/0001_initial.sql`](/c:/laragon/www/portfolio/migrations/0001_initial.sql)
- [`src/index.ts`](/c:/laragon/www/portfolio/src/index.ts)
- [`src/views.ts`](/c:/laragon/www/portfolio/src/views.ts)

## Official References

- D1 getting started: https://developers.cloudflare.com/d1/get-started/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- R2 bucket creation: https://developers.cloudflare.com/r2/buckets/create-buckets/
