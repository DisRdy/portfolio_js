import type { Env, FlashData, SessionPayload, SessionState } from "../types";
import {
  getRequestIp,
  getSessionCookieName,
  getSessionTtlSeconds,
  nowUnix,
  parseCookies,
  randomToken,
  serializeCookie,
} from "./utils";

interface SessionRow {
  id: string;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: string;
  last_activity: number;
}

function freshPayload(): SessionPayload {
  return { csrfToken: randomToken(40) };
}

function createSession(request: Request, deletedIds: string[] = []): SessionState {
  return {
    id: randomToken(40),
    userId: null,
    payload: freshPayload(),
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get("User-Agent"),
    lastActivity: nowUnix(),
    deletedIds,
    dirty: true,
  };
}

function parsePayload(payload: string): SessionPayload {
  try {
    const parsed = JSON.parse(payload) as Partial<SessionPayload>;
    return {
      csrfToken: parsed.csrfToken || randomToken(40),
      flash: parsed.flash,
      intendedPath: parsed.intendedPath,
    };
  } catch {
    return freshPayload();
  }
}

export async function loadSession(request: Request, env: Env): Promise<SessionState> {
  const cookieName = getSessionCookieName(env);
  const cookies = parseCookies(request.headers.get("Cookie"));
  const sessionId = cookies[cookieName];

  if (!sessionId) {
    return createSession(request);
  }

  const row = await env.DB.prepare(
    "SELECT id, user_id, ip_address, user_agent, payload, last_activity FROM sessions WHERE id = ? LIMIT 1",
  ).bind(sessionId).first<SessionRow>();

  if (!row) {
    return createSession(request, [sessionId]);
  }

  const expiresAt = Number(row.last_activity) + getSessionTtlSeconds(env);
  if (expiresAt <= nowUnix()) {
    return createSession(request, [sessionId]);
  }

  return {
    id: row.id,
    userId: row.user_id ? Number(row.user_id) : null,
    payload: parsePayload(row.payload),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    lastActivity: Number(row.last_activity),
    deletedIds: [],
    dirty: false,
  };
}

export async function commitSession(request: Request, env: Env, session: SessionState, response: Response): Promise<Response> {
  session.ipAddress = getRequestIp(request);
  session.userAgent = request.headers.get("User-Agent");
  session.lastActivity = nowUnix();

  const deletes = Array.from(new Set(session.deletedIds.filter((id) => id !== session.id)));
  const statements = deletes.map((id) => env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id));
  statements.push(
    env.DB.prepare(
      `INSERT INTO sessions (id, user_id, ip_address, user_agent, payload, last_activity)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id = excluded.user_id,
         ip_address = excluded.ip_address,
         user_agent = excluded.user_agent,
         payload = excluded.payload,
         last_activity = excluded.last_activity`,
    ).bind(
      session.id,
      session.userId,
      session.ipAddress,
      session.userAgent,
      JSON.stringify(session.payload),
      session.lastActivity,
    ),
  );

  await env.DB.batch(statements);

  response.headers.append(
    "Set-Cookie",
    serializeCookie(getSessionCookieName(env), session.id, {
      httpOnly: true,
      maxAge: getSessionTtlSeconds(env),
      path: "/",
      sameSite: "Lax",
      secure: new URL(request.url).protocol === "https:",
    }),
  );

  return response;
}

export function pullFlash(session: SessionState): FlashData {
  const flash = session.payload.flash ?? {};
  if (session.payload.flash) {
    delete session.payload.flash;
    session.dirty = true;
  }
  return flash;
}

export function setFlash(session: SessionState, flash: FlashData): void {
  session.payload.flash = flash;
  session.dirty = true;
}

export function setIntendedPath(session: SessionState, path: string): void {
  session.payload.intendedPath = path;
  session.dirty = true;
}

export function pullIntendedPath(session: SessionState): string | null {
  const intended = session.payload.intendedPath ?? null;
  if (session.payload.intendedPath) {
    delete session.payload.intendedPath;
    session.dirty = true;
  }
  return intended;
}

export function regenerateSession(session: SessionState): void {
  session.deletedIds.push(session.id);
  session.id = randomToken(40);
  session.dirty = true;
}

export function resetSession(session: SessionState): void {
  session.deletedIds.push(session.id);
  session.id = randomToken(40);
  session.userId = null;
  session.payload = freshPayload();
  session.dirty = true;
}

export function verifyCsrfToken(session: SessionState, candidate: string): boolean {
  return Boolean(candidate) && candidate === session.payload.csrfToken;
}
