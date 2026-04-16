import { and, asc, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  conversationTable,
  messageFrontEndSchema,
  messageTable,
} from "@demo/db/schema";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  getConversations: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const conversations = await ctx.db
        .select({
          id: conversationTable.id,
          title: conversationTable.title,
          status: conversationTable.status,
          createdAt: conversationTable.createdAt,
          updatedAt: conversationTable.updatedAt,
        })
        .from(conversationTable)
        .where(
          and(
            eq(conversationTable.userId, ctx.session.userId),
            eq(conversationTable.orgId, ctx.session.orgId),
            eq(conversationTable.isActive, true),
            eq(conversationTable.agentType, "assistant"),
          ),
        )
        .orderBy(desc(conversationTable.updatedAt))
        .limit(limit);

      return conversations;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db
        .select()
        .from(messageTable)
        .where(
          and(
            eq(messageTable.conversationId, input.conversationId),
            eq(messageTable.isVisible, true),
            input.cursor
              ? lt(messageTable.createdAt, new Date(input.cursor))
              : undefined,
          ),
        )
        .orderBy(asc(messageTable.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const extra = messages.pop();
        if (extra) {
          nextCursor = extra.createdAt.toISOString();
        }
      }

      const parsed = messages
        .map((m) => {
          const result = messageFrontEndSchema.safeParse({
            ...m,
            attachments: m.attachments ? JSON.parse(m.attachments) : [],
          });
          return result.success ? result.data : null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);

      return { messages: parsed, nextCursor };
    }),

  status: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.db.query.conversationTable.findFirst({
        where: and(
          eq(conversationTable.id, input.conversationId),
          eq(conversationTable.userId, ctx.session.userId),
        ),
        columns: { status: true },
      });
      return { isProcessing: conversation?.status === "in_progress" };
    }),

  /**
   * Create a new conversation. Calls the Hono server via authedFetch
   * so the auth token is forwarded.
   */
  createConversation: protectedProcedure
    .input(
      z.object({
        newConversationId: z.string().optional(),
        initialMessage: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.authedFetch(`${ctx.serverUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newConversationId: input.newConversationId,
          initialMessage: input.initialMessage,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create conversation: ${text}`,
        });
      }

      const data = (await res.json()) as { conversationId: string };
      return { conversationId: data.conversationId };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.authedFetch(
        `${ctx.serverUrl}/chat/${input.conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input.message }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send message: ${text}`,
        });
      }

      return { success: true };
    }),

  updateTitle: protectedProcedure
    .input(z.object({ conversationId: z.string(), title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(conversationTable)
        .set({ title: input.title })
        .where(
          and(
            eq(conversationTable.id, input.conversationId),
            eq(conversationTable.userId, ctx.session.userId),
          ),
        );
      return { success: true };
    }),

  stopGeneration: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(conversationTable)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(conversationTable.id, input.conversationId),
            eq(conversationTable.userId, ctx.session.userId),
            eq(conversationTable.status, "in_progress"),
          ),
        );
      return { success: true };
    }),
});
