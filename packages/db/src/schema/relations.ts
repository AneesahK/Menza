import { relations } from "drizzle-orm";

import { conversationTable } from "./conversation.js";
import { messageTable } from "./message.js";
import { orgMemberTable } from "./org-member.js";
import { organizationTable } from "./organization.js";
import { userTable } from "./user.js";
import { widgetTable } from "./widget.js";

export const userRelations = relations(userTable, ({ many }) => ({
  orgMembers: many(orgMemberTable),
  conversations: many(conversationTable),
  messages: many(messageTable),
  widgets: many(widgetTable),
}));

export const organizationRelations = relations(
  organizationTable,
  ({ many }) => ({
    orgMembers: many(orgMemberTable),
    conversations: many(conversationTable),
  }),
);

export const orgMemberRelations = relations(orgMemberTable, ({ one }) => ({
  user: one(userTable, {
    fields: [orgMemberTable.userId],
    references: [userTable.id],
  }),
  organization: one(organizationTable, {
    fields: [orgMemberTable.orgId],
    references: [organizationTable.id],
  }),
}));

export const conversationRelations = relations(
  conversationTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [conversationTable.userId],
      references: [userTable.id],
    }),
    organization: one(organizationTable, {
      fields: [conversationTable.orgId],
      references: [organizationTable.id],
    }),
    parentConversation: one(conversationTable, {
      fields: [conversationTable.parentConversationId],
      references: [conversationTable.id],
      relationName: "parent_child",
    }),
    childConversations: many(conversationTable, {
      relationName: "parent_child",
    }),
    messages: many(messageTable),
    widgets: many(widgetTable),
  }),
);

export const messageRelations = relations(messageTable, ({ one }) => ({
  user: one(userTable, {
    fields: [messageTable.userId],
    references: [userTable.id],
  }),
  organization: one(organizationTable, {
    fields: [messageTable.orgId],
    references: [organizationTable.id],
  }),
  conversation: one(conversationTable, {
    fields: [messageTable.conversationId],
    references: [conversationTable.id],
  }),
}));

export const widgetRelations = relations(widgetTable, ({ one }) => ({
  user: one(userTable, {
    fields: [widgetTable.userId],
    references: [userTable.id],
  }),
  organization: one(organizationTable, {
    fields: [widgetTable.orgId],
    references: [organizationTable.id],
  }),
  conversation: one(conversationTable, {
    fields: [widgetTable.conversationId],
    references: [conversationTable.id],
  }),
}));
