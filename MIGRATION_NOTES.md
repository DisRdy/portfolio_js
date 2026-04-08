# Migration Notes

## Preserved Behavior

- Route structure is preserved for all discovered public and authenticated routes.
- Public pages remain server-rendered and keep the existing markup/CSS/JS structure.
- Session-based authentication remains cookie-backed and database-backed.
- Login still redirects to the intended path or `/dashboard`.
- Registration still auto-logs the user in after success.
- Comment rate limiting remains 5 attempts per IP per hour with the same Indonesian flash error.
- Project and blog CRUD still scope records to the authenticated user.
- Project downloads still use `/project/{id}/download` and preserve the original filename.
- Public blog pages still list and show only `published` posts.
- Blog slugs remain fixed after creation, matching the current Laravel controller behavior.
- Blog images remain publicly reachable under `/storage/<key>`.
- New project files and blog images are stored as public Supabase Storage URLs while legacy relative keys still resolve through the same compatibility routes.

## Behavior That Could Not Be Preserved 1:1

- `/fix-storage` is now a compatibility no-op returning the same success text, because Cloudflare Workers + Supabase Storage do not use Laravel storage symlinks.
- `/dashboard/blogs/{blog}` currently exists in Laravel because of `Route::resource()`, but the controller has no `show()` method. The Worker keeps the route and returns `404` instead of reproducing Laravel’s framework exception.
- Laravel’s default exception pages are replaced with Worker-rendered HTML error pages.
- The runtime no longer depends on PHP sessions, Eloquent, or the local filesystem.
- The deployable runtime is now the Worker entrypoint plus Cloudflare bindings and Supabase Storage.

## Source-Truth Quirks Preserved Deliberately

- `GET /register` still renders the current stubbed page (`HUUU` / `Cari Apa Bang?`) instead of restoring the older commented-out form, because the checked-in Blade file is the current visible behavior.
- Public `/projects` still only shows grouped categories `design`, `pdf`, `tutorial`, and `certificate` when unfiltered, even though the live database and dashboard flow know about `cybersecurity`.
- Blog detail pages still only render the cover image inside the subtitle block, matching the current Blade nesting.
- Comments still do not persist `ip_address`, even though the column exists, because the current Laravel controller does not write it.

## Platform Limitations

- Cloudflare Workers cannot write to a local disk, so uploads are moved to Supabase Storage.
- There is no native Laravel Blade runtime on Workers, so the HTML is rendered from TypeScript string templates.
- Queue, mail, and Artisan runtime facilities are not migrated as active services because the audited app does not use them for product behavior.
- Using `SUPABASE_ANON_KEY` for server-side uploads requires Storage policies that allow the Worker to insert and delete files in the `portfolio` bucket.

## Manual Follow-up Steps

1. Create and bind a D1 database in `wrangler.toml`.
2. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` for local development and deployed Workers.
3. Ensure the Supabase `portfolio` bucket exists and is public.
4. Apply `migrations/0001_initial.sql` to D1.
5. Export or migrate existing SQLite data into D1.
6. Upload existing `storage/app/public/projects/*` and `storage/app/public/blogs/*` files into the Supabase `portfolio` bucket using the same object keys.
7. Ensure Supabase Storage policies allow the Worker to upload and delete files with the configured key.

## Live Database Divergence Captured

- The live SQLite database contains schema/state not fully represented by the checked-in Laravel migrations:
  - `projects.category` also allows `web3`.
  - `blogs` includes `excerpt`, `thumbnail`, `meta_title`, and `meta_description`.
- The Worker schema keeps those live-database details so the D1 target does not lose persisted shape.
