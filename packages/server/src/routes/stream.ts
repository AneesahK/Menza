import { Hono } from "hono";
import { Redis } from "ioredis";

import type { AppBindings } from "../lib/types.js";
import { streamSSE } from "hono/streaming";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const CHANNEL_PATTERN = /^(conversation)\.(.+)$/;

export const streamRouter = new Hono<AppBindings>();

/**
 * GET /stream?channel=conversation.{id}
 *
 * SSE endpoint that reads from a Redis Stream and forwards events to the client.
 * Uses XREAD BLOCK for efficient long-polling.
 */
streamRouter.get("/stream", (c) => {
  const channel = c.req.query("channel");
  if (!channel) {
    return c.json({ error: "Missing channel query parameter" }, 400);
  }

  const match = channel.match(CHANNEL_PATTERN);
  if (!match) {
    return c.json(
      { error: "Invalid channel format. Expected: conversation.{id}" },
      400,
    );
  }

  return streamSSE(c, async (stream) => {
    // Create a dedicated Redis connection for blocking reads
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    let lastId = "$"; // Start from new messages only
    let isAborted = false;

    // Handle reconnection via Last-Event-ID
    const lastEventId = c.req.header("Last-Event-ID");
    if (lastEventId) {
      lastId = lastEventId;
    }

    stream.onAbort(() => {
      isAborted = true;
      void redis.quit();
    });

    await stream.writeSSE({
      event: "connection.established",
      data: JSON.stringify({}),
      id: "0",
    });

    let heartbeatCount = 0;
    let messageCount = 0;

    while (!isAborted) {
      try {
        const results = await redis.xread(
          "COUNT",
          100,
          "BLOCK",
          10000, // 10 second block timeout
          "STREAMS",
          channel,
          lastId,
        );

        if (isAborted) break;

        if (!results) {
          // Timeout — send heartbeat
          heartbeatCount++;
          await stream.writeSSE({
            event: "heartbeat",
            data: JSON.stringify({ count: heartbeatCount }),
          });
          continue;
        }

        for (const [, messages] of results) {
          for (const [id, fields] of messages) {
            lastId = id;
            messageCount++;

            const parsed = parseStreamMessage(fields);
            if (!parsed) continue;

            await stream.writeSSE({
              event: parsed.event,
              data: parsed.data,
              id,
            });
          }
        }
      } catch (error) {
        if (isAborted) break;
        console.error("Stream read error:", error);
        break;
      }
    }

    console.log(
      `SSE stream closed for ${channel}: ${messageCount} messages, ${heartbeatCount} heartbeats`,
    );
    try {
      await redis.quit();
    } catch {
      // Connection may already be closed
    }
  });
});

function parseStreamMessage(
  fields: Array<string>,
): { event: string; data: string } | null {
  const map = new Map<string, string>();
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];
    if (key !== undefined && value !== undefined) {
      map.set(key, value);
    }
  }

  const event = map.get("event");
  const data = map.get("data");
  if (!event || !data) return null;

  return { event, data };
}
