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

## Behavior That Could Not Be Preserved 1:1

- `/fix-storage` is now a compatibility no-op returning the same success text, because Cloudflare Workers + R2 do not use Laravel storage symlinks.
- `/dashboard/blogs/{blog}` currently exists in Laravel because of `Route::resource()`, but the controller has no `show()` method. The Worker keeps the route and returns `404` instead of reproducing Laravel’s framework exception.
- Laravel’s default exception pages are replaced with Worker-rendered HTML error pages.
- The runtime no longer depends on PHP sessions, Eloquent, or the local filesystem.
- Existing Laravel/PHP files remain in the repository as migration reference material, but the deployable runtime is now the Worker entrypoint plus Cloudflare bindings.

## Source-Truth Quirks Preserved Deliberately

- `GET /register` still renders the current stubbed page (`HUUU` / `Cari Apa Bang?`) instead of restoring the older commented-out form, because the checked-in Blade file is the current visible behavior.
- Public `/projects` still only shows grouped categories `design`, `pdf`, `tutorial`, and `certificate` when unfiltered, even though the live database and dashboard flow know about `cybersecurity`.
- Blog detail pages still only render the cover image inside the subtitle block, matching the current Blade nesting.
- Comments still do not persist `ip_address`, even though the column exists, because the current Laravel controller does not write it.

## Platform Limitations

- Cloudflare Workers cannot write to a local disk, so uploads are moved to R2.
- There is no native Laravel Blade runtime on Workers, so the HTML is rendered from TypeScript string templates.
- Queue, mail, and Artisan runtime facilities are not migrated as active services because the audited app does not use them for product behavior.

## Manual Follow-up Steps

1. Create and bind a D1 database in `wrangler.toml`.
2. Create and bind an R2 bucket in `wrangler.toml`.
3. Apply `migrations/0001_initial.sql` to D1.
4. Export or migrate existing SQLite data into D1.
5. Upload existing `storage/app/public/projects/*` and `storage/app/public/blogs/*` files into the R2 bucket using the same object keys.
6. Regenerate `package-lock.json` with `npm install`, since the dependency graph is now Wrangler/TypeScript-based.

## Live Database Divergence Captured

- The live SQLite database contains schema/state not fully represented by the checked-in Laravel migrations:
  - `projects.category` also allows `web3`.
  - `blogs` includes `excerpt`, `thumbnail`, `meta_title`, and `meta_description`.
- The Worker schema keeps those live-database details so the D1 target does not lose persisted shape.
