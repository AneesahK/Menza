import type { Context, Next } from "hono";
import { jwtVerify } from "jose";

import type { AppBindings } from "../lib/types.js";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "change-me-to-a-random-secret";
const secretKey = new TextEncoder().encode(AUTH_SECRET);

/**
 * JWT auth middleware.
 * Extracts and verifies the JWT from the Authorization header or cookie.
 * Sets `c.var.auth = { userId, orgId }` for downstream handlers.
 */
export async function authMiddleware(
  c: Context<AppBindings>,
  next: Next,
): Promise<Response | undefined> {
  // Try Authorization header first, then cookie
  let token: string | undefined;

  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    const cookie = c.req.header("Cookie");
    if (cookie) {
      const match = cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("auth-token="));
      if (match) {
        token = match.split("=")[1];
      }
    }
  }

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.userId as string | undefined;
    const orgId = payload.orgId as string | undefined;

    if (!userId || !orgId) {
      return c.json({ error: "Invalid token: missing userId or orgId" }, 401);
    }

    c.set("auth", { userId, orgId });
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
