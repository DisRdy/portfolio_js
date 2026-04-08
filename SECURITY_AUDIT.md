# Security Audit

Audit date: 2026-04-08

## Executive Summary

This repository is in materially better shape than a typical rushed framework migration. The strongest existing controls are:

- D1 access is consistently parameterized with prepared statements in [src/repositories/data.ts](src/repositories/data.ts).
- CSRF validation is enforced for every non-`GET`/`HEAD` route in [src/index.ts:661](src/index.ts#L661) using the session token generated and checked in [src/lib/session.ts:170](src/lib/session.ts#L170).
- Session fixation is mitigated by rotating the session ID on login in [src/lib/session.ts:156](src/lib/session.ts#L156).
- Project and blog ownership checks are enforced before update/delete operations in [src/index.ts:495](src/index.ts#L495), [src/index.ts:541](src/index.ts#L541), [src/index.ts:604](src/index.ts#L604), and [src/index.ts:645](src/index.ts#L645).
- Server-rendered user content is escaped before insertion into HTML in [src/views/pages.ts:783](src/views/pages.ts#L783) and [src/views/pages.ts:792](src/views/pages.ts#L792).

No critical remote-auth-bypass or SQL-injection issue was identified in the current codebase.

The most important risks found were:

- login brute-force exposure on `POST /login` before this review
- a storage-permission design risk if deployment relies on `SUPABASE_ANON_KEY` for write/delete access
- production error leakage through debug defaults before this review
- an SSRF-like outbound fetch path through arbitrary absolute storage URLs before this review

High-priority code fixes have now been applied. One high-severity configuration risk remains and requires Supabase dashboard changes.

## Attack Surface Overview

### Public routes

- `GET /`
- `GET /projects`
- `GET /comments`
- `POST /comments`
- `GET /project/{id}/download`
- `GET /blog`
- `GET /blog/{slug}`
- `GET /storage/*`
- `GET /fix-storage`
- `GET /login`
- `POST /login`
- `GET /register` and `POST /register` only if `REGISTRATION_ENABLED=true`
- `GET /git-test` only when debug mode is enabled

### Authenticated routes

- `POST /logout`
- `GET /dashboard`
- `GET /dashboard/projects`
- `POST /dashboard/projects`
- `PUT /dashboard/projects/{id}`
- `DELETE /dashboard/projects/{id}`
- `GET /dashboard/blogs`
- `POST /dashboard/blogs`
- `PUT/PATCH /dashboard/blogs/{id}`
- `DELETE /dashboard/blogs/{id}`
- compatibility `GET /dashboard/blogs/{id}/edit` and `GET /dashboard/blogs/{id}`

### Data stores and external services

- D1 for users, sessions, cache/rate limits, comments, projects, and blogs
- Supabase Storage bucket `portfolio` for project files and blog images
- Cloudflare static asset binding for `public/`

## Findings By Severity

## Critical

No critical findings were identified in the current codebase.

## High

### H-1: Login endpoint was unthrottled, enabling brute-force and credential stuffing

- Evidence:
  - Login handling is implemented in [src/index.ts:325](src/index.ts#L325).
  - Before this review, that path performed no rate-limit check at all.
  - Rate-limit helpers existed only for comments in [src/repositories/data.ts:123](src/repositories/data.ts#L123) and [src/repositories/data.ts:135](src/repositories/data.ts#L135).
- Exploit scenario:
  - An attacker could automate repeated `POST /login` attempts against one or many email addresses until a password matched.
  - Because the app uses bcrypt and returns a generic invalid-credentials message, the likely attack was online credential stuffing rather than user enumeration.
- Remediation:
  - Added D1-backed login throttling keyed by IP and IP+email in [src/index.ts:325](src/index.ts#L325).
  - Added configurable limits in [src/lib/utils.ts:184](src/lib/utils.ts#L184), [wrangler.toml:10](wrangler.toml#L10), [wrangler.toml:11](wrangler.toml#L11), [.env.example:4](.env.example#L4), and [.dev.vars.example:4](.dev.vars.example#L4).
  - Added rate-limit clearing on successful login in [src/repositories/data.ts:147](src/repositories/data.ts#L147).
- Status: Fixed in code.

### H-2: Storage write/delete permissions can become public if deployment relies on `SUPABASE_ANON_KEY`

- Evidence:
  - Storage client creation is in [src/lib/storage.ts:34](src/lib/storage.ts#L34).
  - The Worker now supports `SUPABASE_SERVICE_ROLE_KEY`, but still falls back to `SUPABASE_ANON_KEY` when no service-role secret is configured.
  - The app needs upload/delete privileges for `uploadPublicFile()` and `deleteStoredFile()` in [src/lib/storage.ts:94](src/lib/storage.ts#L94) and [src/lib/storage.ts:112](src/lib/storage.ts#L112).
- Exploit scenario:
  - Supabase `anon` is the unauthenticated public role. If bucket policies are loosened so the Worker can upload/delete with the anon key, any client holding that same public key can call the Storage API directly outside the app.
  - That can lead to arbitrary file uploads, overwrite attempts, or deletions in the `portfolio` bucket.
- Remediation:
  - Configure `SUPABASE_SERVICE_ROLE_KEY` as a Worker secret and use it for server-side upload/delete operations.
  - Keep the bucket public only for reads if the product requires public assets.
  - Remove any `anon` `INSERT`, `UPDATE`, or `DELETE` storage policy for the `portfolio` bucket.
- Status: Partially fixed in code by adding service-role support, but manual Supabase policy changes are still required.

## Medium

### M-1: Production error details were exposed by default through debug configuration

- Evidence:
  - Raw error messages are rendered when debug is enabled in [src/index.ts:939](src/index.ts#L939).
  - Debug mode was previously enabled by default in configuration. It is now defaulted off in [wrangler.toml:9](wrangler.toml#L9), [.env.example:3](.env.example#L3), and [.dev.vars.example:3](.dev.vars.example#L3).
- Exploit scenario:
  - A malformed request or upstream storage/database failure could expose internal error text to end users, helping attackers map infrastructure, storage bindings, or request-handling edge cases.
- Remediation:
  - Keep `APP_DEBUG=false` in deployed Workers.
  - Only enable debug locally.
- Status: Fixed in code/config defaults. Still verify deployed secrets/vars manually.

### M-2: The download route previously allowed arbitrary absolute URLs from the database

- Evidence:
  - The public project download route fetches the stored file URL in [src/index.ts:843](src/index.ts#L843).
  - Storage normalization is performed by [src/lib/storage.ts:85](src/lib/storage.ts#L85).
  - Before this review, `resolveStoredStorageUrl()` returned any absolute URL unchanged.
- Exploit scenario:
  - If an attacker ever managed to poison `projects.file_path` in D1, the Worker would perform a server-side fetch to that attacker-controlled URL when `/project/{id}/download` was requested.
  - In a Worker environment this is not a traditional internal-network SSRF, but it still creates an attacker-controlled outbound fetch primitive.
- Remediation:
  - `resolveStoredStorageUrl()` now accepts only recognized storage keys or Supabase public bucket URLs.
- Status: Fixed in code.

### M-3: CSP and response hardening were weaker than necessary

- Evidence:
  - Security headers are set in [src/index.ts:114](src/index.ts#L114).
  - Before this review, the HTML CSP allowed `'unsafe-eval'` and lacked `base-uri`, `form-action`, `frame-ancestors`, and `object-src`.
- Exploit scenario:
  - A weaker CSP reduces the blast radius protection if any templating or browser parsing bug is introduced later.
  - Missing browser hardening headers also leave avoidable gaps around referrer leakage and embedding behavior.
- Remediation:
  - Tightened the HTML CSP in [src/index.ts:114](src/index.ts#L114).
  - Added `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, and HTTPS-only HSTS in the same function.
  - Added a restrictive CSP sandbox for SVG responses.
- Status: Fixed in code.

### M-4: Multipart form bodies were parsed before auth checks with no pre-parse size cap

- Evidence:
  - Form parsing happens before route authorization in [src/index.ts:909](src/index.ts#L909).
  - The parser lives in [src/index.ts:141](src/index.ts#L141).
  - File size checks in [src/index.ts:251](src/index.ts#L251) occur only after `formData()` has already parsed the request.
- Exploit scenario:
  - An attacker could send oversized multipart bodies to protected routes and force the Worker to parse them before auth rejection.
  - Cloudflare request limits reduce the impact, but this still increases avoidable memory/CPU pressure.
- Remediation:
  - Added a 12 MB request-body gate before parsing multipart or URL-encoded forms in [src/index.ts:81](src/index.ts#L81) and [src/index.ts:155](src/index.ts#L155).
  - Oversized requests now return a `413` error page in [src/index.ts:912](src/index.ts#L912).
- Status: Fixed in code.

### M-5: Session rows record IP/User-Agent but do not enforce them on reuse

- Evidence:
  - Sessions store `ip_address` and `user_agent` in [src/lib/session.ts:85](src/lib/session.ts#L85).
  - Reuse checks in [src/lib/session.ts:51](src/lib/session.ts#L51) only validate existence and TTL, not binding consistency.
- Exploit scenario:
  - If a session cookie is stolen, it remains reusable from another browser or IP until it expires.
  - `HttpOnly`, `Secure`, and `SameSite=Lax` reduce exposure, but they do not prevent reuse after theft.
- Remediation:
  - If the app needs stronger session assurance, add device binding, IP/UA validation with tolerant heuristics, or shorter session TTLs with re-authentication.
- Status: Not fixed in code because strict binding can create false positives and visible behavior changes.

## Low

### L-1: The public diagnostic route `/git-test` exposed deployment fingerprinting

- Evidence:
  - The route exists in [src/index.ts:883](src/index.ts#L883).
- Exploit scenario:
  - Publicly reachable diagnostic routes help attackers confirm deployment state and fingerprint operational behavior.
- Remediation:
  - The route now returns `404` unless debug mode is enabled.
- Status: Fixed in code.

### L-2: External `target="_blank"` links were missing `rel="noopener noreferrer"`

- Evidence:
  - External links are rendered in [src/views/pages.ts:167](src/views/pages.ts#L167), [src/views/pages.ts:168](src/views/pages.ts#L168), and [src/views/pages.ts:169](src/views/pages.ts#L169).
- Exploit scenario:
  - The opened page could manipulate `window.opener` and attempt tabnabbing.
- Remediation:
  - Added `rel="noopener noreferrer"` to each external link.
- Status: Fixed in code.

### L-3: Rate-limit/session IP handling trusted spoofable forwarding data

- Evidence:
  - IP extraction lives in [src/lib/utils.ts:156](src/lib/utils.ts#L156).
  - Before this review, the code fell back to `X-Forwarded-For`.
- Exploit scenario:
  - In non-Cloudflare environments or certain test/proxy setups, attackers could spoof `X-Forwarded-For` and dilute IP-based controls.
- Remediation:
  - IP extraction now trusts `CF-Connecting-IP` only and otherwise falls back to localhost.
- Status: Fixed in code.

### L-4: Comment submissions were not persisting source IPs even though the schema supported it

- Evidence:
  - Comment creation is in [src/repositories/data.ts:116](src/repositories/data.ts#L116).
  - The schema already included `comments.ip_address`.
- Exploit scenario:
  - Abuse response and incident review were weaker because submitted comment rows had no IP record at all.
- Remediation:
  - Comment creation now stores the request IP gathered in [src/index.ts:420](src/index.ts#L420).
- Status: Fixed in code.

## Additional Review Notes

### Authentication and session management

- Password verification uses bcrypt-compatible hashes in [src/index.ts:307](src/index.ts#L307) and [src/index.ts:311](src/index.ts#L311).
- Laravel `$2y$` hashes are normalized for compatibility in [src/index.ts:303](src/index.ts#L303).
- Sessions are stored server-side in D1 and the cookie is marked `HttpOnly`, `SameSite=Lax`, and `Secure` on HTTPS in [src/lib/session.ts:116](src/lib/session.ts#L116).

### Authorization and IDOR review

- Dashboard routes call `requireAuth()` in [src/index.ts:295](src/index.ts#L295).
- Project ownership is enforced before update/delete in [src/index.ts:495](src/index.ts#L495) and [src/index.ts:541](src/index.ts#L541).
- Blog ownership is enforced before update/delete in [src/index.ts:604](src/index.ts#L604) and [src/index.ts:645](src/index.ts#L645).
- No broken access control or IDOR was found in the authenticated CRUD paths that were inspected.

### D1 query safety

- The repository layer uses bound parameters consistently, for example in [src/repositories/data.ts:79](src/repositories/data.ts#L79), [src/repositories/data.ts:182](src/repositories/data.ts#L182), and [src/repositories/data.ts:265](src/repositories/data.ts#L265).
- No SQL string concatenation was found in the data-access paths reviewed.

### XSS review

- Blog content is escaped before newline conversion in [src/views/pages.ts:792](src/views/pages.ts#L792).
- Blog image URLs are attribute-escaped in [src/views/pages.ts:783](src/views/pages.ts#L783).
- Dashboard modal data attributes are escaped before being consumed by `public/app.js`, for example [src/views/pages.ts:851](src/views/pages.ts#L851).
- No direct reflected or stored XSS path was confirmed in the current rendering code.

### File upload and storage review

- Project uploads are intentionally general file uploads and are delivered as downloads through [src/index.ts:843](src/index.ts#L843).
- Blog images are validated as images in [src/index.ts:563](src/index.ts#L563) and [src/index.ts:611](src/index.ts#L611), then proxied through [src/lib/storage.ts:125](src/lib/storage.ts#L125).
- Public project files and blog images remain internet-reachable by product design.
- The main remaining storage risk is policy design in Supabase, not a D1 or Worker query bug.

### Dependency review

- The runtime dependency surface is small: [package.json](package.json) currently lists `bcryptjs` and `@supabase/supabase-js`.
- `npm audit --json` returned zero known vulnerabilities on 2026-04-08.
