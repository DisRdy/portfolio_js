# Migration Plan

## Current Laravel Inventory

### Runtime
- Framework: Laravel 12.43.1 on PHP 8.3.
- Frontend delivery: Blade-rendered HTML with a shared CSS file and a small DOM script.
- Current database engine: SQLite (`DB_CONNECTION=sqlite`, live data in `database/database.sqlite`).
- Current auth mode: session-based `web` guard backed by the `sessions` table.
- Current session driver: `database`.
- Current queue driver: `database`, but no application jobs are dispatched.
- Current mail driver: `log`, but no application mail flow is implemented.
- Current filesystem usage: local `public` disk under `storage/app/public`.

### Middleware
- `web`
- `guest`
- `auth`
- Custom `App\Http\Middleware\SecurityHeaders`

### Controllers / Closures
- `AuthController`
- `CommentController`
- `DashboardController`
- `Dashboard\ProjectController`
- `Dashboard\BlogController`
- `PublicBlogController`
- Route closures for `/`, `/projects`, `/project/{id}/download`, `/fix-storage`, `/git-test`, `/login`, `/register`, `/logout`

### Models
- `User`
- `Project`
- `Comment`
- `Blog`

### Validation Rules
- Login: `email` required/email, `password` required.
- Register: `name` required/max 255, `email` required/email/max 255/unique, `password` required/min 8/confirmed.
- Comments: `name` required/max 255, `comment` required/max 1000.
- Projects create: `title` required/max 255, `description` nullable/max 1000, `category` in `design,pdf,cybersecurity,tutorial,certificate`, `file` required/max 10240 KB.
- Projects update: same as create, but `file` optional.
- Blogs create/update: `title` required/max 255, `subtitle` nullable/max 255, `image` optional image/max 2048 KB, `content` required, `status` in `draft,published`, `published_at` nullable date.

### Blade / Frontend
- Plain Blade pages plus component partials.
- No Vue, React, Inertia, Alpine, or Livewire feature code in the app flow.
- Shared frontend assets:
  - `resources/css/app.css`
  - `resources/js/app.js`
- Static images:
  - `public/img/LOGODR.png`
  - `public/favicon.ico`
  - `public/robots.txt`

### File Upload / Storage
- Projects are uploaded to `storage/app/public/projects/<category>/...`.
- Blog images are uploaded to `storage/app/public/blogs/...`.
- Public blog images are served from `/storage/<path>`.
- Project downloads are served through `/project/{id}/download`.

### Scheduler / Queue / Mail
- `routes/console.php` only contains the stock inspire command.
- Queue tables exist but no app-level job dispatch was found.
- Mail config exists but no mail send flow was found.

### Environment / Config Signals
- SQLite database.
- Database-backed sessions.
- Database-backed cache used by the comment rate limiter.
- Local filesystem uploads.

## Business-Critical Behaviors

### Public
- `/` renders the portfolio landing page.
- `/projects` lists public projects, grouped by category.
- `/projects?category=...` filters by allowed categories.
- `/comments` renders the comment form and reverse-chronological comment list.
- `/comments` POST stores a comment, optionally attaching `user_id` if logged in.
- `/project/{id}/download` downloads the stored file with its original filename.
- `/blog` lists only published blog posts.
- `/blog/{slug}` shows only published blog posts.

### Authenticated
- `/dashboard` shows counts and recent project/blog lists for the logged-in user.
- `/dashboard/projects` manages only the logged-in user’s projects.
- `/dashboard/blogs` manages only the logged-in user’s blogs.
- `/logout` invalidates the session and redirects home.

### Auth
- Session login with redirect to intended location or `/dashboard`.
- Registration auto-logs the new user in.
- Guest-only routes for login/register.

### Rate limiting
- Comments are limited to 5 submissions per IP per hour.
- The user-facing rate-limit error is in Indonesian.

## Route Mapping

| Current Route | Laravel Source | Cloudflare Worker Target |
| --- | --- | --- |
| `GET /` | route closure | Worker HTML handler |
| `GET /projects` | route closure | Worker HTML handler with D1 query |
| `GET /comments` | `CommentController@index` | Worker HTML handler with D1 query |
| `POST /comments` | `CommentController@store` | Worker form handler + D1 + cache-based rate limit |
| `GET /project/{id}/download` | route closure | Worker download handler + Supabase object fetch |
| `GET /fix-storage` | route closure | Worker compatibility no-op |
| `GET /login` | route closure | Worker guest page |
| `POST /login` | `AuthController@login` | Worker auth handler + database session |
| `GET /register` | route closure | Worker guest page preserving current stubbed view |
| `POST /register` | `AuthController@register` | Worker auth handler + bcrypt + database session |
| `GET /dashboard` | `DashboardController@index` | Worker auth page + D1 summary queries |
| `GET /dashboard/projects` | `Dashboard\ProjectController@index` | Worker auth page |
| `POST /dashboard/projects` | `Dashboard\ProjectController@store` | Worker auth handler + Supabase upload + D1 insert |
| `PUT /dashboard/projects/{id}` | `Dashboard\ProjectController@update` | Worker auth handler + optional Supabase replace + D1 update |
| `DELETE /dashboard/projects/{id}` | `Dashboard\ProjectController@destroy` | Worker auth handler + Supabase delete + D1 delete |
| `POST /logout` | route closure | Worker auth handler + session reset |
| `GET /dashboard/blogs` | `Dashboard\BlogController@index` | Worker auth page |
| `POST /dashboard/blogs` | `Dashboard\BlogController@store` | Worker auth handler + optional Supabase upload + D1 insert |
| `GET /dashboard/blogs/create` | `Dashboard\BlogController@create` | Worker auth redirect to index |
| `GET /dashboard/blogs/{blog}` | resource route to missing method | Worker compatibility route returning `404` |
| `PUT/PATCH /dashboard/blogs/{blog}` | `Dashboard\BlogController@update` | Worker auth handler + optional Supabase replace + D1 update |
| `DELETE /dashboard/blogs/{blog}` | `Dashboard\BlogController@destroy` | Worker auth handler + optional Supabase delete + D1 delete |
| `GET /dashboard/blogs/{blog}/edit` | `Dashboard\BlogController@edit` | Worker auth redirect to index after ownership check |
| `GET /git-test` | route closure | Worker text response |
| `GET /blog` | `PublicBlogController@index` | Worker HTML handler |
| `GET /blog/{slug}` | `PublicBlogController@show` | Worker HTML handler |
| `GET /storage/*` | public storage symlink | Worker Supabase object proxy |

## Auth Mapping

- Laravel `web` session guard -> Worker-managed database session stored in D1 `sessions`.
- Laravel session cookie -> Worker cookie `laravel-session` by default.
- Laravel flash data -> serialized JSON payload inside the D1 `sessions.payload`.
- Laravel CSRF hidden inputs -> preserved as `_token`, validated against session payload.
- Laravel `redirect()->intended('dashboard')` -> Worker uses `sessions.payload.intendedPath`.
- Laravel password hashing -> Worker uses bcrypt-compatible hashing and accepts existing Laravel `$2y$` hashes.

## Database Mapping

### Source of truth used for migration
- Checked-in Laravel migrations.
- Live SQLite schema from `database/database.sqlite` when it diverged from checked-in migrations.

### Important tables preserved
- `users`
- `password_reset_tokens`
- `sessions`
- `cache`
- `cache_locks`
- `jobs`
- `job_batches`
- `failed_jobs`
- `comments`
- `projects`
- `blogs`

### Important relationships preserved
- `projects.user_id -> users.id`
- `blogs.user_id -> users.id`
- `comments.user_id -> users.id`

### Schema notes carried into D1
- `projects.category` keeps the live SQLite `CHECK` values: `design`, `pdf`, `cybersecurity`, `tutorial`, `certificate`, `web3`.
- `blogs` keeps the live SQLite extra columns (`excerpt`, `thumbnail`, `meta_title`, `meta_description`) even though current UI/controllers do not use them.

## Cloudflare Implementation Map

- Laravel routes -> explicit route handling in `src/index.ts`.
- Eloquent -> prepared-statement repository functions in `src/repositories/data.ts`.
- Blade -> server-rendered HTML string views in `src/views/pages.ts`.
- Local filesystem -> Supabase Storage bucket `portfolio`.
- SQLite -> Cloudflare D1 binding `DB`.
- Laravel database sessions -> D1-backed session records with serialized flash/CSRF payload.
- Security headers middleware -> Worker response hardening in `src/index.ts`.
