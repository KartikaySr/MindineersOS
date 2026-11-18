import type http from "node:http";
import {
  checkRevision,
  checkWorkspaceContents,
  checkWorkspaceName,
} from "../services/mindineers-workspace-input";
import {
  workspaceRequestHash,
  workspaceStore,
  type WorkspaceWrite,
} from "../services/mindineers-workspace-store";
import { readWorkspaceBody } from "./mindineers-body";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { AuthStore, type DrizzleDatabase } from "../services/auth-store";
import {
  CSRF_HEADER_NAME,
  findActiveSession,
  parseSessionCookie,
  verifyCsrfToken,
} from "./auth/sessions";
import { type CompatRuntimeState } from "./compat-route-shared";
import { sendJson } from "./response";

export async function handleMindineersWorkspaces(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  state: CompatRuntimeState,
) {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  const match =
    /^\/api\/mindineers\/workspaces(?:\/([A-Za-z0-9_-]{1,120})(\/(?:contents|history)(?:\/\d+)?)?)?$/.exec(
      path,
    );
  if (!match) return false;
  if (match[2]?.startsWith("/contents/")) {
    sendJson(res, 404, { error: "route_missing" });
    return true;
  }
  res.setHeader("Cache-Control", "private, no-store");
  const reply = (status: number, body: unknown) => {
    sendJson(res, status, body);
    return true;
  };
  const id = match[1];
  const contents = match[2] === "/contents";
  const history = match[2]?.startsWith("/history");
  const allow = history
    ? "GET"
    : contents
      ? "GET, PUT"
      : id
        ? "GET, PUT, PATCH"
        : "GET";
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
  const store = await workspaceStore(db, session.identityId);
  if (!id) return reply(200, { items: await store.list() });
  if (req.method === "GET") {
    if (history) {
      if (!(await store.read(id, false)))
        return reply(404, { error: "workspace_missing" });
      const version = match[2]?.split("/")[2];
      if (version) {
        const item = await store.version(id, Number(version));
        return item
          ? reply(200, item)
          : reply(404, { error: "revision_missing" });
      }
      const before = Number(
        new URL(req.url ?? "/", "http://localhost").searchParams.get(
          "before",
        ) ?? 2147483647,
      );
      if (!Number.isInteger(before) || before < 1 || before > 2147483647)
        return reply(422, { error: "invalid_cursor" });
      const items = await store.versions(id, before);
      return reply(200, {
        items,
        nextBefore:
          items.length === 50 ? items[items.length - 1]!.revision : null,
      });
    }
    const item = await store.read(id, contents);
    return item ? reply(200, item) : reply(404, { error: "workspace_missing" });
  }
  const csrf = req.headers[CSRF_HEADER_NAME];
  if (typeof csrf !== "string" || !verifyCsrfToken(session, csrf))
    return reply(403, { error: "csrf_required" });
  const body = await readWorkspaceBody(req, res);
  if (!body) return true;
  const requestId = req.headers["idempotency-key"];
  if (
    requestId !== undefined &&
    (typeof requestId !== "string" ||
      !/^[A-Za-z0-9_-]{16,120}$/.test(requestId))
  )
    return reply(422, { error: "invalid_request_id" });
  let input: WorkspaceWrite;
  try {
    input = {
      requestId: requestId ?? null,
      hash: workspaceRequestHash(req.method ?? "GET", path, body),
      ...(!contents && { name: checkWorkspaceName(body.name) }),
      ...((contents || body.contents !== undefined) && {
        contents: checkWorkspaceContents(body.contents),
      }),
      ...((contents || req.method === "PATCH") && {
        revision: checkRevision(body.revision),
      }),
    };
  } catch {
    return reply(422, { error: "invalid_workspace" });
  }
  const result = await store.write(id, input);
  return reply(result.status, result.body);
}
