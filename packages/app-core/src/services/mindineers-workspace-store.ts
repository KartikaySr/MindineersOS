import { createHash } from "node:crypto";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { WorkspaceContents } from "./mindineers-workspace-input";

export type WorkspaceDatabase = PgDatabase<PgQueryResultHKT>;
export interface WorkspaceWrite {
  name?: string;
  contents?: WorkspaceContents;
  revision?: number;
  requestId: string | null;
  hash: string;
}
export function workspaceRequestHash(
  method: string,
  path: string,
  body: Record<string, unknown>,
): string {
  // Preserve request bytes semantically as parsed JSON. A retry sends the same stored body.
  return createHash("sha256")
    .update(JSON.stringify([method, path, body]))
    .digest("hex");
}
export async function workspaceStore(db: WorkspaceDatabase, ownerId: string) {
  const {
    mindineersWorkspaceTable: table,
    mindineersWorkspaceHistoryTable: history,
  } = await import("@elizaos/plugin-sql");
  const owner = eq(table.ownerId, ownerId);
  const scope = (id: string) => and(owner, eq(table.id, id));
  const fields = { id: table.id, name: table.name, revision: table.revision };
  const historyScope = (id: string) =>
    and(eq(history.ownerId, ownerId), eq(history.workspaceId, id));
  return {
    async list() {
      return db
        .select(fields)
        .from(table)
        .where(owner)
        .orderBy(table.id)
        .limit(1000);
    },
    async read(id: string, contents: boolean) {
      return (
        await db
          .select({
            ...fields,
            ...(contents ? { contents: table.contents } : {}),
          })
          .from(table)
          .where(scope(id))
      )[0];
    },
    async versions(id: string, before: number) {
      return db
        .select({
          revision: history.revision,
          name: history.name,
          savedAt: history.savedAt,
        })
        .from(history)
        .where(and(historyScope(id), lt(history.revision, before)))
        .orderBy(desc(history.revision))
        .limit(50);
    },
    async version(id: string, revision: number) {
      return (
        await db
          .select({
            id: history.workspaceId,
            name: history.name,
            revision: history.revision,
            contents: history.contents,
          })
          .from(history)
          .where(and(historyScope(id), eq(history.revision, revision)))
      )[0];
    },
    async write(id: string, input: WorkspaceWrite) {
      return db.transaction(async (tx) => {
        // Transaction-scoped lock serializes retries and creation even before a workspace row exists.
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${JSON.stringify([ownerId, id])}, 0))`,
        );
        if (input.requestId) {
          const [receipt] = await tx
            .select()
            .from(history)
            .where(
              and(historyScope(id), eq(history.requestId, input.requestId)),
            );
          if (receipt) {
            if (receipt.requestHash !== input.hash)
              return { status: 409, body: { error: "request_id_reused" } };
            return {
              status: 200,
              body: { id, name: receipt.name, revision: receipt.revision },
            };
          }
        }
        const [previous] = await tx.select().from(table).where(scope(id));
        if (input.revision === undefined && previous) {
          if (input.contents === undefined && input.name === previous.name)
            return {
              status: 200,
              body: { id, name: previous.name, revision: previous.revision },
            };
          return { status: 409, body: { error: "workspace_exists" } };
        }
        if (input.revision !== undefined) {
          if (!previous)
            return { status: 404, body: { error: "workspace_missing" } };
          if (previous.revision !== input.revision)
            return { status: 409, body: { error: "stale_revision" } };
          // Preserve the pre-history version of workspaces created by older releases.
          await tx
            .insert(history)
            .values({
              ownerId,
              workspaceId: id,
              revision: previous.revision,
              name: previous.name,
              contents: previous.contents,
              savedAt: Date.now(),
            })
            .onConflictDoNothing();
        }
        const values = {
          name: input.name ?? previous!.name,
          contents: input.contents ?? previous?.contents ?? null,
        };
        const [saved] = previous
          ? await tx
              .update(table)
              .set({ ...values, revision: previous.revision + 1 })
              .where(scope(id))
              .returning(fields)
          : await tx
              .insert(table)
              .values({ ownerId, id, ...values })
              .returning(fields);
        if (!saved) throw Error("Workspace save returned no row");
        await tx
          .insert(history)
          .values({
            ownerId,
            workspaceId: id,
            ...values,
            revision: saved.revision,
            savedAt: Date.now(),
            requestId: input.requestId,
            requestHash: input.hash,
          });
        return { status: previous ? 200 : 201, body: saved };
      });
    },
  };
}
