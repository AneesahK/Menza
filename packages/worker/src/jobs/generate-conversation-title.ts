import type { Job } from "bullmq";
import { asc, eq } from "drizzle-orm";
import { Redis } from "ioredis";

import { db } from "../lib/db.js";
import { conversationTable, messageTable } from "@demo/db/schema";
import { StreamEmitter } from "@demo/llm/stream/emitter";
import type { JobData, JobReturn } from "@demo/queue/jobs";
import { GoogleGenAI } from "@google/genai";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const TITLE_SYSTEM_PROMPT = `You are a title generation assistant. Generate a concise, descriptive title for a conversation.

Rules:
- Maximum 6 words
- Use Title Case
- Be specific and descriptive
- Do not use quotes
- Do not include "Chat about" or similar prefixes`;

/**
 * Generate a short title for a conversation using Gemini Flash Lite.
 * Emits a chat.title.created event after a brief delay.
 */
export async function processGenerateConversationTitle(
  job: Job<
    JobData<"generate-conversation-title">,
    JobReturn<"generate-conversation-title">,
    "generate-conversation-title"
  >,
): Promise<JobReturn<"generate-conversation-title">> {
  const { conversationId } = job.data;

  const messages = await db
    .select({
      role: messageTable.role,
      message: messageTable.message,
    })
    .from(messageTable)
    .where(eq(messageTable.conversationId, conversationId))
    .orderBy(asc(messageTable.createdAt))
    .limit(15);

  const conversationText = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map(
      (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.message ?? ""}`,
    )
    .join("\n")
    .slice(0, 2000); // Truncate to avoid huge prompts

  let title = "New Conversation";

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn("GOOGLE_AI_API_KEY not set, using default title");
      return { title };
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${TITLE_SYSTEM_PROMPT}\n\nConversation:\n${conversationText}\n\nGenerate a title:`,
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: 30,
        temperature: 0.3,
      },
    });

    const generatedTitle = response.text?.trim();
    if (generatedTitle && generatedTitle.length > 0) {
      title = generatedTitle;
    }
  } catch (error) {
    console.error("Title generation failed:", error);
  }

  await db
    .update(conversationTable)
    .set({ title })
    .where(eq(conversationTable.id, conversationId));

  // Wait 3 seconds then emit the title event
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const channel = `conversation.${conversationId}`;
  const streamEmitter = new StreamEmitter(redis, channel);

  try {
    await streamEmitter.emit({
      event: "chat.title.created",
      data: { chatId: conversationId, title },
    });
  } finally {
    await redis.quit();
  }

  return { title };
}
