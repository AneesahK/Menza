import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { widgetTable } from "@demo/db/schema";

export const widgetRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const widget = await ctx.db.query.widgetTable.findFirst({
        where: eq(widgetTable.id, input.id),
      });
      return widget ?? null;
    }),
});
