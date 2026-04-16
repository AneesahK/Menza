import superjson from "superjson";

import { auth, getAuthToken } from "../auth";
import { createDbClient } from "@demo/db";
import { initTRPC, TRPCError } from "@trpc/server";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const { db } = createDbClient(databaseUrl, {
  min: 1,
  max: 5,
  allowExitOnIdle: true,
});

const serverUrl = process.env.SERVER_URL ?? "http://localhost:3001";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();
  const token = await getAuthToken();

  /**
   * Fetch wrapper that injects the auth token into outbound requests
   * to the Hono server. Mirrors the original's ctx.authedFetch pattern.
   */
  const authedFetch = (
    url: string | URL,
    fetchOpts?: RequestInit,
  ): Promise<Response> => {
    const fetchHeaders = new Headers(fetchOpts?.headers);
    if (token) {
      fetchHeaders.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, {
      ...fetchOpts,
      headers: fetchHeaders,
    });
  };

  return {
    db,
    session,
    token,
    serverUrl,
    authedFetch,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      token: ctx.token!,
      authedFetch: ctx.authedFetch,
    },
  });
});
