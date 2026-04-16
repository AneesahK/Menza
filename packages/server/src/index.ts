import { Hono } from "hono";

import type { AppBindings } from "./lib/types.js";
import { authMiddleware } from "./middleware/auth.js";
import { chatRouter } from "./routes/chat.js";
import { streamRouter } from "./routes/stream.js";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";

const app = new Hono<AppBindings>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

// Auth middleware for routes that need it (skip health + stream)
app.use("*", (c, next) => {
  if (c.req.path === "/health" || c.req.path === "/stream") return next();
  return authMiddleware(c, next);
});

app.route("/", chatRouter);
app.route("/", streamRouter);

const PORT = 3001;

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Server running on http://localhost:${PORT}`);

export default app;
