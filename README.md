# Portfolio Worker

This repository now runs as a Cloudflare Worker with:

- Cloudflare Workers
- Cloudflare D1
- TypeScript
- Cloudflare R2 for uploaded project files and blog images

## Scripts

```bash
npm run dev
npm run typecheck
npm run d1:migrate:local
npm run d1:migrate:remote
npm run deploy
```

## Runtime Structure

- Worker entry: [src/index.ts](/c:/laragon/www/portfolio/src/index.ts)
- D1 access: [src/repositories/data.ts](/c:/laragon/www/portfolio/src/repositories/data.ts)
- Sessions: [src/lib/session.ts](/c:/laragon/www/portfolio/src/lib/session.ts)
- Storage helper: [src/lib/storage.ts](/c:/laragon/www/portfolio/src/lib/storage.ts)
- Views: [src/views/pages.ts](/c:/laragon/www/portfolio/src/views/pages.ts)

## Setup

- Configure D1 in [wrangler.toml](/c:/laragon/www/portfolio/wrangler.toml)
- Create a Cloudflare R2 bucket named `portfolio`
- Keep the `STORAGE` R2 binding in [wrangler.toml](/c:/laragon/www/portfolio/wrangler.toml)
- Apply the D1 migrations from [migrations/0001_initial.sql](/c:/laragon/www/portfolio/migrations/0001_initial.sql)

See [DEPLOY.md](/c:/laragon/www/portfolio/DEPLOY.md) for the full deployment checklist.
