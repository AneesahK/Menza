import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "../lib/db.js";
import type { AppBindings } from "../lib/types.js";
import { conversationTable, messageTable } from "@demo/db/schema";
import { createID } from "@demo/db/utils";
import { queues } from "@demo/queue";

const createChatBodySchema = z.object({
  newConversationId: z.string().optional(),
  initialMessage: z.string().optional(),
});

const sendMessageBodySchema = z.object({
  message: z.string().min(1),
});

export const chatRouter = new Hono<AppBindings>();

/**
 * POST /chat — Create a new conversation.
 * Optionally includes an initial user message.
 */
chatRouter.post("/chat", async (c) => {
  const { userId, orgId } = c.var.auth;
  const body = createChatBodySchema.parse(await c.req.json());

  const conversationId = body.newConversationId ?? createID("chat");
  const runId = createID("run");

  await db.insert(conversationTable).values({
    id: conversationId,
    userId,
    orgId,
    agentType: "assistant",
    status: "in_progress",
    isActive: true,
    runId,
  });

  if (body.initialMessage) {
    const messageId = createID("message");
    await db.insert(messageTable).values({
      id: messageId,
      userId,
      orgId,
      conversationId,
      message: body.initialMessage,
      role: "user",
      isVisible: true,
      runId,
    });

    // Enqueue preference detection job (non-blocking)
    console.log("Enqueuing detect-preferences job for message:", body.initialMessage);
    void queues.mainQueue.add("detect-preferences", {
      userId,
      orgId,
      messageId,
      messageContent: body.initialMessage,
    });

    await queues.mainQueue.add("run-agent", {
      userId,
      orgId,
      conversationId,
    });
  }

  return c.json({ conversationId }, 201);
});

/**
 * POST /chat/:conversationId — Send a message to an existing conversation.
 */
chatRouter.post("/chat/:conversationId", async (c) => {
  const { userId, orgId } = c.var.auth;
  const conversationId = c.req.param("conversationId");
  const body = sendMessageBodySchema.parse(await c.req.json());

  const conversation = await db.query.conversationTable.findFirst({
    where: and(
      eq(conversationTable.id, conversationId),
      eq(conversationTable.userId, userId),
      eq(conversationTable.orgId, orgId),
      eq(conversationTable.isActive, true),
    ),
  });

  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const runId = createID("run");

  await db
    .update(conversationTable)
    .set({ status: "in_progress", runId })
    .where(eq(conversationTable.id, conversationId));

  const messageId = createID("message");
  await db.insert(messageTable).values({
    id: messageId,
    userId,
    orgId,
    conversationId,
    message: body.message,
    role: "user",
    isVisible: true,
    runId,
  });

  // Enqueue preference detection job (non-blocking)
  console.log("Enqueuing detect-preferences job for message:", body.message);
  void queues.mainQueue.add("detect-preferences", {
    userId,
    orgId,
    messageId,
    messageContent: body.message,
  });

  await queues.mainQueue.add("run-agent", {
    userId,
    orgId,
    conversationId,
  });

  return c.json({ success: true });
});
