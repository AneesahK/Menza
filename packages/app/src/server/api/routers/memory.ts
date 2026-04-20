import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { userMemoryTable } from "@demo/db/schema";
import { createID } from "@demo/db/utils";
import { TRPCError } from "@trpc/server";
import { embed } from "@demo/llm/helpers/embeddings";

export const memoryRouter = createTRPCRouter({
  /**
   * Get all memories for the current user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memories = await ctx.db
      .select({
        id: userMemoryTable.id,
        content: userMemoryTable.content,
        metadata: userMemoryTable.metadata,
        createdAt: userMemoryTable.createdAt,
        updatedAt: userMemoryTable.updatedAt,
      })
      .from(userMemoryTable)
      .where(
        and(
          eq(userMemoryTable.userId, ctx.session.userId),
          eq(userMemoryTable.orgId, ctx.session.orgId),
        ),
      )
      .orderBy(userMemoryTable.createdAt);

    return memories;
  }),

  /**
   * Create a new memory manually.
   */
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Generate embedding for the content
      const embedding = await embed(input.content);

      const [memory] = await ctx.db
        .insert(userMemoryTable)
        .values({
          id: createID("memory"),
          userId: ctx.session.userId,
          orgId: ctx.session.orgId,
          content: input.content,
          embedding,
          metadata: {
            confidence: 1.0,
            source: "manual",
          },
        })
        .returning();

      if (!memory) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create memory",
        });
      }

      return memory;
    }),

  /**
   * Update an existing memory.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Generate new embedding for the updated content
      const embedding = await embed(input.content);

      const existing = await ctx.db.query.userMemoryTable.findFirst({
        where: and(
          eq(userMemoryTable.id, input.id),
          eq(userMemoryTable.userId, ctx.session.userId),
          eq(userMemoryTable.orgId, ctx.session.orgId),
        ),
        columns: {
          metadata: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Memory not found",
        });
      }

      const [updated] = await ctx.db
        .update(userMemoryTable)
        .set({
          content: input.content,
          embedding,
          metadata: {
            confidence: existing.metadata?.confidence ?? 1,
            ...(existing.metadata?.category
              ? { category: existing.metadata.category }
              : {}),
            source: "manual",
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userMemoryTable.id, input.id),
            eq(userMemoryTable.userId, ctx.session.userId),
            eq(userMemoryTable.orgId, ctx.session.orgId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Memory not found",
        });
      }

      return updated;
    }),

  /**
   * Delete a memory.
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(userMemoryTable)
        .where(
          and(
            eq(userMemoryTable.id, input.id),
            eq(userMemoryTable.userId, ctx.session.userId),
            eq(userMemoryTable.orgId, ctx.session.orgId),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Memory not found",
        });
      }

      return { success: true };
    }),
});
