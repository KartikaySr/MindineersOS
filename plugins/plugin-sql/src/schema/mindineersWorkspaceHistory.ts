import {
  bigint,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  unique,
} from "drizzle-orm/pg-core";
import { mindineersWorkspaceTable } from "./mindineersWorkspace";

export const mindineersWorkspaceHistoryTable = pgTable(
  "mindineers_workspace_history",
  {
    ownerId: text("owner_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    revision: integer("revision").notNull(),
    name: text("name").notNull(),
    contents: jsonb("contents"),
    savedAt: bigint("saved_at", { mode: "number" }).notNull(),
    requestId: text("request_id"),
    requestHash: text("request_hash"),
  },
  (table) => [
    primaryKey({ columns: [table.ownerId, table.workspaceId, table.revision] }),
    unique("mindineers_workspace_request_key").on(
      table.ownerId,
      table.workspaceId,
      table.requestId,
    ),
    foreignKey({
      columns: [table.ownerId, table.workspaceId],
      foreignColumns: [
        mindineersWorkspaceTable.ownerId,
        mindineersWorkspaceTable.id,
      ],
    }),
  ],
);
