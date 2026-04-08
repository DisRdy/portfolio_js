import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "../types";

const SUPABASE_STORAGE_BUCKET = "portfolio";
const SUPABASE_PUBLIC_PATH = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;

let cachedClient: SupabaseClient | null = null;
let cachedClientKey = "";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

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

function getSupabaseClient(env: Env): SupabaseClient {
  const url = requireEnv(env.SUPABASE_URL, "SUPABASE_URL");
  const key = requireEnv(env.SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY");
  const cacheKey = `${url}::${key}`;

  if (!cachedClient || cachedClientKey !== cacheKey) {
    cachedClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    cachedClientKey = cacheKey;
  }

  return cachedClient;
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
      const markerIndex = url.pathname.indexOf(SUPABASE_PUBLIC_PATH);
      if (markerIndex === -1) {
        return null;
      }

      return decodeStorageKey(url.pathname.slice(markerIndex + SUPABASE_PUBLIC_PATH.length));
    } catch {
      return null;
    }
  }

  return decodeStorageKey(value.replace(/^\/+/, ""));
}

export function getPublicStorageUrl(env: Env, key: string): string {
  const client = getSupabaseClient(env);
  const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

export function resolveStoredStorageUrl(env: Env, storedValue: string): string {
  const value = storedValue.trim();
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const key = extractStorageKey(value);
  if (!key) {
    throw new Error("Invalid storage reference.");
  }

  return getPublicStorageUrl(env, key);
}

export async function uploadPublicFile(env: Env, key: string, file: File): Promise<{ key: string; publicUrl: string }> {
  const client = getSupabaseClient(env);
  const { error } = await client.storage.from(SUPABASE_STORAGE_BUCKET).upload(key, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

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

  const client = getSupabaseClient(env);
  const { error } = await client.storage.from(SUPABASE_STORAGE_BUCKET).remove([key]);
  if (error) {
    throw new Error(error.message);
  }
}

export async function proxyStorageObject(env: Env, key: string): Promise<Response> {
  const upstream = await fetch(getPublicStorageUrl(env, key));
  if (upstream.status === 404) {
    return new Response("Not Found", { status: 404 });
  }

  if (!upstream.ok) {
    throw new Error(`Storage request failed with status ${upstream.status}.`);
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const contentLength = upstream.headers.get("Content-Length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(upstream.body, {
    headers,
    status: upstream.status,
  });
}
