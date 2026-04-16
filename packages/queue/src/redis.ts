import type { ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";

function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: parsed.password } : {}),
    ...(parsed.username ? { username: parsed.username } : {}),
  };
}

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisConfig: ConnectionOptions = parseRedisUrl(redisUrl);

/**
 * Create a new ioredis client from the shared REDIS_URL.
 * Callers are responsible for disconnecting when done.
 */
export function createRedisClient(): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // required by BullMQ
  });
}
