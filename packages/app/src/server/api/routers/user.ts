import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { userTable } from "@demo/db/schema";
import Anthropic from "@anthropic-ai/sdk";

export const userRouter = createTRPCRouter({
  getInstructions: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.userTable.findFirst({
      where: eq(userTable.id, ctx.session.userId),
      columns: { instructions: true },
    });
    return { instructions: user?.instructions ?? "" };
  }),

  updateInstructions: protectedProcedure
    .input(z.object({ instructions: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(userTable)
        .set({ instructions: input.instructions })
        .where(eq(userTable.id, ctx.session.userId));

      // Early return for empty instructions
      if (!input.instructions.trim()) {
        return { instructions: "", confirmation: "" };
      }

      // Generate confirmation message
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system:
          "You are confirming to a user what business instructions you will now follow. Be concise and specific. Do not be sycophantic.",
        messages: [
          {
            role: "user",
            content: `The user just saved these instructions: '${input.instructions}'. Summarise back to them in 1-2 sentences exactly what you will now always remember, using natural language.`,
          },
        ],
      });

      const confirmation =
        response.content[0]?.type === "text" ? response.content[0].text : "";

      return { instructions: input.instructions, confirmation };
    }),
});
