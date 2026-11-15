import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { authIdentityTable } from "./authIdentity";

export const mindineersWorkspaceTable = pgTable(
  "mindineers_workspaces",
  {
    ownerId: text("owner_id")
      .notNull()
      .references(() => authIdentityTable.id),
    id: text("id").notNull(),
    name: text("name").notNull(),
    revision: integer("revision").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.ownerId, table.id] })],
);
