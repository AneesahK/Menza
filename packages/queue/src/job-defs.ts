import type { Job } from "bullmq";

import type { ItemConfig } from "@demo/db/types/widget/core";

/**
 * All job definitions for the demo worker.
 * Maps job name -> { data, returnType }.
 */
export type JobDefinitions = {
  /**
   * Run the main data agent for a conversation.
   * Enqueued when the server receives a new chat message.
   */
  "run-agent": {
    data: {
      userId: string;
      orgId: string;
      conversationId: string;
    };
    returnType: {
      success: boolean;
    };
  };

  /**
   * Generate a short title for a conversation using Gemini.
   * Enqueued after the first user message is added to a conversation.
   */
  "generate-conversation-title": {
    data: {
      userId: string;
      orgId: string;
      conversationId: string;
    };
    returnType: {
      title: string;
    };
  };

  /**
   * Run the widget agent to create/update a widget.
   * Enqueued by the show_widget tool when spawning a widget agent.
   */
  "update-widget-in-chat": {
    data: {
      userId: string;
      orgId: string;
      widgetId: string;
      conversationId: string;
      instruction: string;
    };
    returnType:
      | {
          widgetConfig: ItemConfig;
          success: true;
        }
      | {
          widgetConfig: null;
          message: string;
          success: false;
        };
  };
};

export type JobName = keyof JobDefinitions;

export type JobData<T extends JobName> = JobDefinitions[T]["data"];

export type JobReturn<T extends JobName> = JobDefinitions[T]["returnType"];

export type JobHandler<K extends JobName> = (
  job: Job<JobData<K>, JobReturn<K>, K>,
) => Promise<JobReturn<K>>;
