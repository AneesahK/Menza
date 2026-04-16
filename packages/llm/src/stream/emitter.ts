import type { Redis } from "ioredis";

import type { StreamEvent } from "./events.js";

const DEFAULT_MAX_STREAM_LENGTH = 10_000;
const DEFAULT_TTL_SECONDS = 15 * 60; // 15 minutes

/**
 * Emits typed events to a Redis Stream via XADD.
 * Used by agents to publish real-time events that the SSE endpoint reads.
 */
export class StreamEmitter {
  private readonly redis: Redis;
  private readonly channel: string;
  private readonly maxStreamLength: number;
  private readonly ttlSeconds: number;

  constructor(
    redis: Redis,
    channel: string,
    options?: {
      maxStreamLength?: number;
      ttlSeconds?: number;
    },
  ) {
    this.redis = redis;
    this.channel = channel;
    this.maxStreamLength =
      options?.maxStreamLength ?? DEFAULT_MAX_STREAM_LENGTH;
    this.ttlSeconds = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  }

  /** Uses a Redis pipeline to atomically XADD + set TTL. */
  async emit(data: StreamEvent): Promise<string | null> {
    try {
      const pipeline = this.redis.pipeline();

      pipeline.xadd(
        this.channel,
        "MAXLEN",
        "~",
        String(this.maxStreamLength),
        "*",
        "event",
        data.event,
        "data",
        JSON.stringify(data.data),
        "timestamp",
        Date.now().toString(),
      );

      pipeline.expire(this.channel, this.ttlSeconds);

      const results = await pipeline.exec();
      if (!results) return null;

      // XADD result is the first command — returns the stream entry ID
      const xaddResult = results[0];
      if (xaddResult && !xaddResult[0]) {
        return xaddResult[1] as string;
      }
      return null;
    } catch (error) {
      console.error("StreamEmitter.emit failed:", error);
      return null;
    }
  }

  get channelName(): string {
    return this.channel;
  }
}
