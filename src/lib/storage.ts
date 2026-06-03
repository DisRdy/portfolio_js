import type { Env } from "../types";

const LEGACY_SUPABASE_STORAGE_BUCKET = "portfolio";
const LEGACY_SUPABASE_PUBLIC_PATH = `/storage/v1/object/public/${LEGACY_SUPABASE_STORAGE_BUCKET}/`;

function decodeStorageKey(value: string): string {
  return value
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => decodeURIComponent(segment))
    .join("/");
}

export function encodeStorageKey(value: string): string {
  return value
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getStorageBucket(env: Env): R2Bucket {
  if (!env.STORAGE) {
    throw new Error("R2 STORAGE binding is not configured.");
  }

  return env.STORAGE;
}

export function extractStorageKey(storedValue: string | null | undefined): string | null {
  const value = storedValue?.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("/storage/")) {
    return decodeStorageKey(value.slice("/storage/".length));
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const markerIndex = url.pathname.indexOf(LEGACY_SUPABASE_PUBLIC_PATH);
      if (markerIndex === -1) {
        return null;
      }

      return decodeStorageKey(url.pathname.slice(markerIndex + LEGACY_SUPABASE_PUBLIC_PATH.length));
    } catch {
      return null;
    }
  }

  return decodeStorageKey(value.replace(/^\/+/, ""));
}

export function getPublicStorageUrl(_env: Env, key: string): string {
  return `/storage/${encodeStorageKey(key)}`;
}

export async function uploadPublicFile(env: Env, key: string, file: File): Promise<{ key: string; publicUrl: string }> {
  await getStorageBucket(env).put(key, file, {
    httpMetadata: {
      cacheControl: "public, max-age=3600",
      contentType: file.type || undefined,
    },
  });

  return {
    key,
    publicUrl: getPublicStorageUrl(env, key),
  };
}

export async function deleteStoredFile(env: Env, storedValue: string | null | undefined): Promise<void> {
  const key = extractStorageKey(storedValue);
  if (!key) {
    return;
  }

  await getStorageBucket(env).delete(key);
}

export async function storedFileResponse(env: Env, storedValue: string | null | undefined, options: {
  cacheControl?: string;
  contentDisposition?: string;
  contentType?: string;
} = {}): Promise<Response> {
  const key = extractStorageKey(storedValue);
  if (!key) {
    return new Response("Not Found", { status: 404 });
  }

  const object = await getStorageBucket(env).get(key);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (options.contentType) {
    headers.set("Content-Type", options.contentType);
  }
  headers.set("Content-Length", String(object.size));
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", options.cacheControl ?? object.httpMetadata?.cacheControl ?? "public, max-age=3600");

  if (options.contentDisposition) {
    headers.set("Content-Disposition", options.contentDisposition);
  }

  return new Response(object.body, {
    headers,
    status: 200,
  });
}

export async function proxyStorageObject(env: Env, key: string): Promise<Response> {
  return storedFileResponse(env, key);
}
