import { redisConfig } from "./redis.js";
import { TypedQueue } from "./typed-queue.js";

const mainQueue = new TypedQueue("main", {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 10000,
    },
    removeOnFail: {
      age: 72 * 3600,
      count: 10000,
    },
  },
});

export const queues = {
  mainQueue,
};
