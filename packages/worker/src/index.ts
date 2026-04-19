import { Worker } from "bullmq";

import { processDetectPreferences } from "./jobs/detect-preferences.js";
import { processGenerateConversationTitle } from "./jobs/generate-conversation-title.js";
import { processRunAgent } from "./jobs/run-agent.js";
import type { JobData, JobName, JobReturn } from "@demo/queue/jobs";
import { redisConfig } from "@demo/queue/redis";

type ProcessorMap = {
  [K in JobName]?: (
    job: import("bullmq").Job<JobData<K>, JobReturn<K>, K>,
  ) => Promise<JobReturn<K>>;
};

const jobProcessors: ProcessorMap = {
  "run-agent": processRunAgent,
  "generate-conversation-title": processGenerateConversationTitle,
  "detect-preferences": processDetectPreferences,
};

const worker = new Worker(
  "main",
  async (job) => {
    const processor = jobProcessors[job.name as JobName];
    if (!processor) {
      console.error(`No processor found for job: ${job.name}`);
      throw new Error(`Unknown job type: ${job.name}`);
    }

    console.log(`Processing job: ${job.name} (${job.id})`);

    // The processor map is keyed by JobName, so we know the types match.
    // We need this cast because TS can't prove the relationship between
    // job.name and the processor's type parameter at the call site.
    const typedProcessor = processor as (
      job: import("bullmq").Job,
    ) => Promise<JobReturn<JobName>>;

    const result = await typedProcessor(job);

    console.log(`Job completed: ${job.name} (${job.id})`);
    return result;
  },
  {
    connection: redisConfig,
    concurrency: 10,
  },
);

worker.on("failed", (job, error) => {
  console.error(`Job failed: ${job?.name} (${job?.id})`, error.message);
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

const shutdown = async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

console.log("Worker started, listening for jobs on 'main' queue");
