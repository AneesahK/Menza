import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { Redis } from "ioredis";

import { db } from "../lib/db.js";
import { createDuckDbQueryFn, getDataSourceContext } from "../lib/duckdb.js";
import { conversationTable } from "@demo/db/schema";
import { createID } from "@demo/db/utils";
import { DataAgent } from "@demo/llm/agents/data-agent";
import { StreamEmitter } from "@demo/llm/stream/emitter";
import { queues } from "@demo/queue";
import type { JobData, JobReturn } from "@demo/queue/jobs";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

/**
 * Process a run-agent job.
 * Creates a DataAgent and runs it, streaming events to Redis.
 */
export async function processRunAgent(
  job: Job<JobData<"run-agent">, JobReturn<"run-agent">, "run-agent">,
): Promise<JobReturn<"run-agent">> {
  const { userId, orgId, conversationId } = job.data;

  // Read the existing runId from the conversation (set by the server)
  const conversation = await db.query.conversationTable.findFirst({
    where: eq(conversationTable.id, conversationId),
    columns: { runId: true, title: true },
  });

  const runId = conversation?.runId ?? createID("run");

  const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const channel = `conversation.${conversationId}`;
  const streamEmitter = new StreamEmitter(redis, channel);

  const queryFn = createDuckDbQueryFn();
  const dataSourceContext = await getDataSourceContext(queryFn);

  try {
    const agent = new DataAgent({
      ctx: {
        db,
        userId,
        orgId,
        conversationId,
        runId,
        streamEmitter,
      },
      dataSourceContext,
      queryFn,
    });

    // Refresh managed system context (includes latest relevant memories) for each user query run
    await agent.createConversation();

    await agent.run();

    if (!conversation?.title) {
      await queues.mainQueue.add("generate-conversation-title", {
        userId,
        orgId,
        conversationId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("run-agent failed:", error);

    await streamEmitter.emit({
      event: "run.failed",
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return { success: false };
  } finally {
    await redis.quit();
  }
}
