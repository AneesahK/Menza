# @demo/queue

Job queue package using [BullMQ](https://docs.bullmq.io/) with Redis.

Provides typed queue definitions, Redis connection helpers, and job type
definitions shared between the server (producer) and worker (consumer).

## Exports

| Import path | What it provides |
| --- | --- |
| `@demo/queue` | `queues.mainQueue` — the typed BullMQ queue instance |
| `@demo/queue/redis` | `redisConfig` (BullMQ connection opts), `createRedisClient()` (ioredis instance) |
| `@demo/queue/jobs` | `JobDefinitions`, `JobName`, `JobData<T>`, `JobReturn<T>`, `JobHandler<T>` types |

## Job types

| Job name | Purpose |
| --- | --- |
| `run-agent` | Execute the LLM data agent for a conversation |
| `generate-conversation-title` | Generate a short title via Gemini after first message |
| `update-widget-in-chat` | Run the widget agent to create/update a chart, table, or metric |

## Relevant docs

- [BullMQ docs](https://docs.bullmq.io/)
- [ioredis](https://github.com/redis/ioredis)
