import type { Redis } from "ioredis";

import { streamEventSchema, type StreamEvent } from "./events.js";

/**
 * Listens to a Redis Stream for events (e.g. run.aborted).
 * Used by agents to detect when a run should be cancelled.
 */
export class StreamListener {
  private readonly redis: Redis;
  private readonly channel: string;
  private isListening = false;
  private onEvent?: (event: StreamEvent) => void;

  constructor(redis: Redis, channel: string) {
    this.redis = redis;
    this.channel = channel;
  }

  start(onEvent: (event: StreamEvent) => void): void {
    this.onEvent = onEvent;
    this.isListening = true;
    // Fire and forget — runs in background
    void this.listenForStreamEvents();
  }

  stop(): void {
    this.isListening = false;
  }

  private async listenForStreamEvents(): Promise<void> {
    let lastId = "$"; // Only new messages

    while (this.isListening) {
      try {
        const results = await this.redis.xread(
          "COUNT",
          10,
          "BLOCK",
          5000,
          "STREAMS",
          this.channel,
          lastId,
        );

        if (!results) continue;

        for (const [, messages] of results) {
          for (const [id, fields] of messages) {
            lastId = id;
            const parsed = parseStreamMessage(fields);
            if (!parsed) continue;

            const result = streamEventSchema.safeParse(parsed);
            if (result.success) {
              this.onEvent?.(result.data);
            }
          }
        }
      } catch (error) {
        if (!this.isListening) break;
        console.error("StreamListener error:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

/**
 * Parse Redis Stream field array ["event", "foo", "data", "bar"] into
 * { event: "foo", data: { ... } }.
 */
function parseStreamMessage(
  fields: Array<string>,
): { event: string; data: Record<string, unknown> } | null {
  const map = new Map<string, string>();
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];
    if (key !== undefined && value !== undefined) {
      map.set(key, value);
    }
  }

  const event = map.get("event");
  const dataStr = map.get("data");
  if (!event || !dataStr) return null;

  try {
    const data = JSON.parse(dataStr) as Record<string, unknown>;
    return { event, data };
  } catch {
    return null;
  }
}
