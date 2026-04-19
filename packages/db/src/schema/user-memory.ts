import { foreignKey, index, jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { id, timestamps } from "../utils.js";
import { organizationTable } from "./organization.js";
import { userTable } from "./user.js";

export interface UserMemoryMetadata {
  confidence: number;
  category?: string;
  source: "automatic" | "manual";
}

export const userMemoryTable = pgTable(
  "user_memory",
  {
    ...id,
    ...timestamps,
    userId: varchar("user_id", { length: 64 }).notNull(),
    orgId: varchar("org_id", { length: 64 }),
    content: text("content").notNull(),
    embedding: jsonb("embedding").$type<number[]>(),
    metadata: jsonb("metadata").$type<UserMemoryMetadata>(),
  },
  (table) => {
    return [
      foreignKey({
        columns: [table.userId],
        foreignColumns: [userTable.id],
        name: "fk__user_memory__user_id",
      }),
      foreignKey({
        columns: [table.orgId],
        foreignColumns: [organizationTable.id],
        name: "fk__user_memory__org_id",
      }),
      index("idx__user_memory__user_id").on(table.userId),
      index("cidx__user_memory__org_id__user_id").on(table.orgId, table.userId),
    ];
  },
);

export type UserMemory = typeof userMemoryTable.$inferSelect;
export type UserMemoryInsert = typeof userMemoryTable.$inferInsert;
