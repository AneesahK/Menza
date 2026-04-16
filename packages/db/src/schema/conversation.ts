import { id, timestamps } from "../utils.js";
import { organizationTable } from "./organization.js";
import { userTable } from "./user.js";
import {
  boolean,
  foreignKey,
  index,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";

export const conversationStatusEnum = [
  "completed",
  "failed",
  "in_progress",
  "cancelled",
] as const;

export const conversationTable = pgTable(
  "conversation",
  {
    ...id,
    ...timestamps,
    userId: varchar("user_id", { length: 64 }),
    orgId: varchar("org_id", { length: 64 }),
    parentConversationId: varchar("parent_conversation_id", {
      length: 64,
    }),
    agentType: varchar("agent_type").notNull().default("assistant"),
    runId: varchar("run_id"),
    status: varchar("status", {
      enum: conversationStatusEnum,
    }),
    isActive: boolean("is_active").notNull().default(true),
    entityId: varchar("entity_id"),
    title: varchar("title"),
  },
  (table) => {
    return [
      foreignKey({
        columns: [table.userId],
        foreignColumns: [userTable.id],
        name: "fk__conversation__user_id",
      }),
      foreignKey({
        columns: [table.orgId],
        foreignColumns: [organizationTable.id],
        name: "fk__conversation__org_id",
      }),
      foreignKey({
        columns: [table.parentConversationId],
        foreignColumns: [table.id],
        name: "fk__conversation__parent_conversation_id",
      }),
      index("idx__conversation__user_id").on(table.userId),
      index("cidx__conversation__org_id__user_id").on(
        table.orgId,
        table.userId,
      ),
      index("cidx__conversation__org_id__entity_id__is_active").on(
        table.orgId,
        table.entityId,
        table.isActive,
      ),
      index("idx__conversation__parent_conversation_id").on(
        table.parentConversationId,
      ),
    ];
  },
);

export type Conversation = typeof conversationTable.$inferSelect;
