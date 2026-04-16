import {
  Queue,
  type Job,
  type JobsOptions,
} from "bullmq";

import type { JobData, JobName, JobReturn } from "./job-defs.js";

/**
 * A BullMQ Queue subclass that enforces type-safe job names and data.
 */
export class TypedQueue extends Queue {
  override add<T extends JobName>(
    name: T,
    data: JobData<T>,
    opts?: JobsOptions,
  ): Promise<Job<JobData<T>, JobReturn<T>, T>> {
    return super.add(name, data, opts) as Promise<
      Job<JobData<T>, JobReturn<T>, T>
    >;
  }
}
