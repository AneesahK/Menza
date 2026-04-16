import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import type { ThinkingContentBlock, ToolCall } from "../types/message.js";
import { id, timestamps } from "../utils.js";
import { conversationTable } from "./conversation.js";
import { organizationTable } from "./organization.js";
import { userTable } from "./user.js";
import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const messageTable = pgTable(
  "message",
  {
    ...id,
    ...timestamps,
    userId: varchar("user_id", { length: 64 }).notNull(),
    orgId: varchar("org_id", { length: 64 }),
    conversationId: varchar("conversation_id", { length: 64 }).notNull(),
    message: text("message"),
    attachments: text("attachments").default("[]"),
    role: varchar("role", {
      enum: ["user", "assistant", "tool", "system"],
    }).notNull(),
    isVisible: boolean("is_visible").notNull(),
    toolCallId: varchar("tool_call_id"),
    toolCalls: jsonb("tool_calls").$type<Array<ToolCall>>(),
    thinkingBlocks:
      jsonb("thinking_blocks").$type<Array<ThinkingContentBlock>>(),
    explanation: text("explanation"),
    runId: varchar("run_id"),
    parentRunId: varchar("parent_run_id"),
  },
  (table) => {
    return [
      foreignKey({
        columns: [table.userId],
        foreignColumns: [userTable.id],
        name: "fk__message__user_id",
      }),
      foreignKey({
        columns: [table.orgId],
        foreignColumns: [organizationTable.id],
        name: "fk__message__org_id",
      }),
      foreignKey({
        columns: [table.conversationId],
        foreignColumns: [conversationTable.id],
        name: "fk__message__conversation_id",
      }),
      index("cidx__message__conversation_id__user_id__created_at").on(
        table.conversationId,
        table.userId,
        table.createdAt.desc(),
      ),
    ];
  },
);

export const messageSelectSchema = createSelectSchema(messageTable);
export type MessageSelect = z.infer<typeof messageSelectSchema>;

export const messageFrontEndSchema = createSelectSchema(messageTable)
  .pick({
    id: true,
    role: true,
    message: true,
    userId: true,
    toolCallId: true,
    createdAt: true,
    toolCalls: true,
  })
  .extend({
    processing: z.boolean().optional().default(false),
    attachments: z.array(z.record(z.string(), z.unknown())).optional(),
  });
export type MessageFrontEnd = z.infer<typeof messageFrontEndSchema>;
