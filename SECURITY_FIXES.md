# Security Fixes

Audit/fix date: 2026-04-08

## Fixed In Code

- Added D1-backed login rate limiting for `POST /login` in [src/index.ts:325](src/index.ts#L325) using cache helpers from [src/repositories/data.ts:123](src/repositories/data.ts#L123) and [src/repositories/data.ts:147](src/repositories/data.ts#L147).
- Tightened response hardening in [src/index.ts:114](src/index.ts#L114):
  - removed `unsafe-eval` from the HTML CSP
  - added `base-uri`, `form-action`, `frame-ancestors`, and `object-src`
  - added `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, and HTTPS-only HSTS
  - added SVG sandbox CSP
- Added a pre-parse multipart/urlencoded body-size gate in [src/index.ts:141](src/index.ts#L141) and [src/index.ts:155](src/index.ts#L155), returning `413` from [src/index.ts:912](src/index.ts#L912).
- Restricted storage URL resolution so the Worker no longer follows arbitrary absolute URLs from D1 in [src/lib/storage.ts:85](src/lib/storage.ts#L85).
- Replaced third-party storage credentials with the Worker-native `STORAGE` R2 binding in [src/lib/storage.ts](src/lib/storage.ts).
- Defaulted debug mode off in [wrangler.toml:9](wrangler.toml#L9), [.env.example:3](.env.example#L3), and [.dev.vars.example:3](.dev.vars.example#L3).
- Restricted `/git-test` to debug mode in [src/index.ts:883](src/index.ts#L883).
- Hardened IP extraction to trust `CF-Connecting-IP` only in [src/lib/utils.ts:156](src/lib/utils.ts#L156).
- Persisted comment source IPs in [src/repositories/data.ts:116](src/repositories/data.ts#L116).
- Added `rel="noopener noreferrer"` to external `target="_blank"` links in [src/views/pages.ts:167](src/views/pages.ts#L167).

## Not Fixed In Code

- Session reuse is still not bound to IP/User-Agent. The app records both values but does not reject a reused cookie from another device in [src/lib/session.ts:51](src/lib/session.ts#L51) and [src/lib/session.ts:85](src/lib/session.ts#L85).
  - This is a deliberate tradeoff to avoid false positives and behavior changes.
- Public asset visibility remains by design.
  - Blog images and project files are intentionally retrievable once their application route or public URL is known.
- `/fix-storage` remains present as a compatibility route in [src/index.ts:879](src/index.ts#L879).
  - It is low risk, but it is not needed for Worker-native storage.

## Manual Actions Required

### 1. Verify R2 bucket binding for privileged storage writes

- Ensure the deployed Worker has the `STORAGE` R2 binding pointed at the `portfolio` bucket.
- Keep the bucket private and serve objects through Worker routes such as `/storage/...`.

### 2. Verify deployed Worker configuration

- Ensure the deployed Worker is not overriding `APP_DEBUG` back to `true`.
- Ensure the deployed Worker has:
  - `LOGIN_RATE_LIMIT_MAX`
  - `LOGIN_RATE_LIMIT_WINDOW_SECONDS`
  - `STORAGE` R2 binding

### 3. Decide whether you want stronger session assurance

- If your threat model includes session theft, consider one or more of:
  - shorter session TTL
  - IP/UA binding with tolerant matching
  - forced re-authentication for sensitive actions

## Verification Performed

- `npm run typecheck` passed after the security fixes.
- `npm audit --json` reported zero known package vulnerabilities on 2026-04-08.
