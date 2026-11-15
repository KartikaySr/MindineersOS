import type http from "node:http";
import { and, asc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { AuthStore, type DrizzleDatabase } from "../services/auth-store";
import {
  CSRF_HEADER_NAME,
  findActiveSession,
  parseSessionCookie,
  verifyCsrfToken,
} from "./auth/sessions";
import {
  type CompatRuntimeState,
  readCompatJsonBody,
} from "./compat-route-shared";
import { sendJson } from "./response";

export async function handleMindineersWorkspaces(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  state: CompatRuntimeState,
) {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  const match =
    /^\/api\/mindineers\/workspaces(?:\/([A-Za-z0-9_-]{1,120}))?$/.exec(path);
  if (!match) return false;
  res.setHeader("Cache-Control", "private, no-store");
  const reply = (status: number, body: unknown) => {
    sendJson(res, status, body);
    return true;
  };
  const id = match[1];
  const allow = id ? "GET, PUT, PATCH" : "GET";
  if (!allow.split(", ").includes(req.method ?? "")) {
    res.setHeader("Allow", allow);
    return reply(405, { error: "method_not_allowed" });
  }
  const cookie = parseSessionCookie(req);
  if (!cookie) return reply(401, { error: "session_required" });
  const db = (
    state.current?.adapter as
      | { db?: DrizzleDatabase & PgDatabase<PgQueryResultHKT> }
      | undefined
  )?.db;
  if (!db) return reply(503, { error: "database_unavailable" });
  const session = await findActiveSession(new AuthStore(db), cookie);
  if (!session || session.kind !== "browser")
    return reply(401, { error: "session_required" });
  const { mindineersWorkspaceTable: table } = await import(
    "@elizaos/plugin-sql"
  );
  const owner = eq(table.ownerId, session.identityId);
  const fields = { id: table.id, name: table.name, revision: table.revision };
  const database: PgDatabase<PgQueryResultHKT> = db;
  if (!id)
    return reply(200, {
      items: await database
        .select(fields)
        .from(table)
        .where(owner)
        .orderBy(asc(table.id)),
    });
  const scope = and(owner, eq(table.id, id));
  const read = async () =>
    (await database.select(fields).from(table).where(scope))[0];
  if (req.method === "GET") {
    const item = await read();
    return item ? reply(200, item) : reply(404, { error: "workspace_missing" });
  }
  const csrf = req.headers[CSRF_HEADER_NAME];
  if (typeof csrf !== "string" || !verifyCsrfToken(session, csrf))
    return reply(403, { error: "csrf_required" });
  const body = await readCompatJsonBody(req, res);
  if (!body) return true;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 300) return reply(422, { error: "invalid_name" });
  if (req.method === "PUT") {
    const [item] = await database
      .insert(table)
      .values({ ownerId: session.identityId, id, name })
      .onConflictDoNothing()
      .returning(fields);
    if (item) return reply(201, item);
    const existing = await read();
    return existing?.name === name
      ? reply(200, existing)
      : reply(409, { error: "workspace_exists" });
  }
  const revision = body.revision;
  if (
    typeof revision !== "number" ||
    !Number.isSafeInteger(revision) ||
    revision < 1
  )
    return reply(422, { error: "invalid_revision" });
  const [updated] = await database
    .update(table)
    .set({ name, revision: sql`${table.revision} + 1` })
    .where(and(scope, eq(table.revision, revision)))
    .returning(fields);
  if (updated) return reply(200, updated);
  return (await read())
    ? reply(409, { error: "stale_revision" })
    : reply(404, { error: "workspace_missing" });
}
