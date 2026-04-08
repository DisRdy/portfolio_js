import type { Env, FlashData } from "../types";

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(value: unknown): string {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, item) => {
    const [name, ...rest] = item.trim().split("=");
    cookies[name] = decodeURIComponent(rest.join("=") || "");
    return cookies;
  }, {});
}

export function serializeCookie(name: string, value: string, options: {
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
} = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? "/"}`);

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);

  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function sqlNow(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  const second = pad(date.getUTCSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const asUtc = normalized.endsWith("Z") ? normalized : `${normalized}Z`;
  const date = new Date(asUtc);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateLong(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return `${pad(date.getUTCDate())} ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateLongTime(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return `${pad(date.getUTCDate())} ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function formatDateBlog(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return `${MONTHS_LONG[date.getUTCMonth()]} ${pad(date.getUTCDate())}, ${date.getUTCFullYear()}`;
}

export function formatDateShort(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return `${pad(date.getUTCDate())} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatKilobytes(bytes: number | null | undefined): string {
  const size = Number(bytes ?? 0);
  return (size / 1024).toFixed(2);
}

export function normalizeMethod(requestMethod: string, formData: FormData | null): string {
  const method = requestMethod.toUpperCase();
  if (method !== "POST" || !formData) {
    return method;
  }

  const override = formData.get("_method");
  if (typeof override === "string" && override.trim()) {
    return override.trim().toUpperCase();
  }

  return method;
}

export function getRequestIp(request: Request): string {
  const connectingIp = request.headers.get("CF-Connecting-IP");
  if (!connectingIp) {
    return "127.0.0.1";
  }

  return connectingIp.trim() || "127.0.0.1";
}

export function getSessionCookieName(env: Env): string {
  return env.SESSION_COOKIE_NAME?.trim() || "laravel-session";
}

export function getSessionTtlSeconds(env: Env): number {
  const minutes = Number.parseInt(env.SESSION_TTL_MINUTES ?? "120", 10);
  return (Number.isFinite(minutes) ? minutes : 120) * 60;
}

export function getCommentRateLimitMax(env: Env): number {
  const max = Number.parseInt(env.COMMENTS_RATE_LIMIT_MAX ?? "5", 10);
  return Number.isFinite(max) ? max : 5;
}

export function getCommentRateLimitWindowSeconds(env: Env): number {
  const seconds = Number.parseInt(env.COMMENTS_RATE_LIMIT_WINDOW_SECONDS ?? "3600", 10);
  return Number.isFinite(seconds) ? seconds : 3600;
}

export function getLoginRateLimitMax(env: Env): number {
  const max = Number.parseInt(env.LOGIN_RATE_LIMIT_MAX ?? "5", 10);
  return Number.isFinite(max) ? max : 5;
}

export function getLoginRateLimitWindowSeconds(env: Env): number {
  const seconds = Number.parseInt(env.LOGIN_RATE_LIMIT_WINDOW_SECONDS ?? "900", 10);
  return Number.isFinite(seconds) ? seconds : 900;
}

export function isRegistrationEnabled(env: Env): boolean {
  return (env.REGISTRATION_ENABLED ?? "false").toLowerCase() === "true";
}

export function randomToken(length = 40): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, length);
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "post";
}

export function fileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

export function buildProjectStorageKey(category: string, originalName: string): string {
  return `projects/${category}/${randomToken(40)}${fileExtension(originalName)}`;
}

export function buildBlogStorageKey(originalName: string): string {
  return `blogs/${randomToken(40)}${fileExtension(originalName)}`;
}

export function truncate(value: string | null | undefined, length: number): string {
  const text = String(value ?? "");
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, Math.max(0, length - 3))}...`;
}

function encodeStoragePath(path: string): string {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function decodeStoragePath(path: string): string {
  return path.split("/").map((segment) => decodeURIComponent(segment)).join("/");
}

export function storageUrl(path: string): string {
  const value = path.trim();
  const supabasePrefix = "/storage/v1/object/public/portfolio/";

  if (!value) {
    return "/storage";
  }

  if (value.startsWith("/storage/")) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const markerIndex = url.pathname.indexOf(supabasePrefix);
      if (markerIndex === -1) {
        return value;
      }

      const key = decodeStoragePath(url.pathname.slice(markerIndex + supabasePrefix.length));
      return `/storage/${encodeStoragePath(key)}`;
    } catch {
      return value;
    }
  }

  return `/storage/${encodeStoragePath(value.replace(/^\/+/, ""))}`;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function htmlDocument(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link rel="icon" href="/img/LOGODR.png" type="image/png">
    <link rel="stylesheet" href="/app.css">
</head>
<body>
${body}
<script src="/app.js"></script>
</body>
</html>`;
}

export function renderValidationError(errors: Record<string, string> | undefined, field: string, className = "form-error"): string {
  const message = errors?.[field];
  return message ? `<span class="${className}">${escapeHtml(message)}</span>` : "";
}

export function renderToast(flash: FlashData): string {
  if (!flash.success && !flash.error) {
    return "";
  }

  return `<div class="toast-container">
        ${flash.success ? `<div class="toast toast-success" id="toast-success"><span class="toast-message">${escapeHtml(flash.success)}</span></div>` : ""}
        ${flash.error ? `<div class="toast toast-error" id="toast-error"><span class="toast-message">${escapeHtml(flash.error)}</span></div>` : ""}
    </div>`;
}

export function formString(formData: FormData | null, key: string): string {
  if (!formData) {
    return "";
  }

  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formFile(formData: FormData | null, key: string): File | null {
  if (!formData) {
    return null;
  }

  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}

export function baseOldValues(old: Record<string, string> | undefined, allowed: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of allowed) {
    if (old?.[key]) {
      values[key] = old[key];
    }
  }
  return values;
}

export function isDebug(env: Env): boolean {
  return (env.APP_DEBUG ?? "").toLowerCase() === "true";
}
