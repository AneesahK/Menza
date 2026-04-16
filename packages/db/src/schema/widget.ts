import { itemStatuses } from "../types/widget/common.js";
import type { ItemConfig } from "../types/widget/core.js";
import { id, timestamp, timestamps } from "../utils.js";
import { conversationTable } from "./conversation.js";
import { organizationTable } from "./organization.js";
import { userTable } from "./user.js";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const widgetTable = pgTable(
  "widget",
  {
    ...id,
    version: integer("version").default(2),
    aiPrompt: text("ai_prompt"),
    userId: varchar("user_id", { length: 64 }).notNull(),
    orgId: varchar("org_id", { length: 64 }),
    conversationId: varchar("conversation_id", { length: 64 }),
    config: jsonb("config").$type<ItemConfig>(),
    explanation: text("explanation"),
    isActive: boolean("is_active").notNull().default(true),
    status: text("status", { enum: itemStatuses }).notNull(),
    isPinned: boolean("is_pinned").default(false),
    createdAt: timestamps.createdAt,
    lastUpdated: timestamp("last_updated")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamps.deletedAt,
  },
  (table) => {
    return [
      foreignKey({
        columns: [table.userId],
        foreignColumns: [userTable.id],
        name: "fk__widget__user_id",
      }),
      foreignKey({
        columns: [table.orgId],
        foreignColumns: [organizationTable.id],
        name: "fk__widget__org_id",
      }),
      foreignKey({
        columns: [table.conversationId],
        foreignColumns: [conversationTable.id],
        name: "fk__widget__conversation_id",
      }),
      index("cidx__widget__org_id__conversation_id").on(
        table.orgId,
        table.conversationId,
      ),
    ];
  },
);
