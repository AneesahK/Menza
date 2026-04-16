import type { Hono } from "hono";

/** Variables available in Hono context after auth middleware */
export type AppBindings = {
  Variables: {
    auth: {
      userId: string;
      orgId: string;
    };
  };
};

export type App = Hono<AppBindings>;
