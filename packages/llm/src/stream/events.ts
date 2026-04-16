import { z } from "zod";

/**
 * All stream event types emitted by agents and consumed by the SSE endpoint.
 * Stripped to the subset needed for the demo (no widget.update.*, assumption.*,
 * deep_analysis.*, task.*, survey.*).
 */
export const streamEventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("connection.established"),
    data: z.object({}),
  }),

  z.object({
    event: z.literal("message.start"),
    data: z.object({
      id: z.string(),
      message: z.string(),
    }),
  }),
  z.object({
    event: z.literal("message.delta"),
    data: z.object({
      id: z.string(),
      message: z.string(),
    }),
  }),

  z.object({
    event: z.literal("tool.start"),
    data: z.object({
      message_id: z.string(),
      tool_call_id: z.string(),
      function_name: z.string(),
    }),
  }),
  z.object({
    event: z.literal("tool.delta"),
    data: z.object({
      message_id: z.string(),
      tool_call_id: z.string(),
      function_name: z.string(),
      arguments: z.string(),
      delta: z.string(),
    }),
  }),
  z.object({
    event: z.literal("tool.complete"),
    data: z.object({
      message_id: z.string(),
      tool_call_id: z.string(),
      function_name: z.string(),
      arguments: z.string(),
    }),
  }),
  z.object({
    event: z.literal("tool.result"),
    data: z.object({
      output: z.object({
        message_id: z.string(),
        tool_call_name: z.string(),
        tool_call_id: z.string(),
        attachments: z.string().optional(),
        message: z.string().optional(),
      }),
    }),
  }),
  z.object({
    event: z.literal("tool.aborted"),
    data: z.object({
      tool_call_id: z.string(),
      message_id: z.string(),
    }),
  }),
  z.object({
    event: z.literal("tool.description"),
    data: z.object({
      message_id: z.string(),
      description: z.string(),
    }),
  }),

  z.object({
    event: z.literal("thinking.start"),
    data: z.object({
      message_id: z.string(),
    }),
  }),
  z.object({
    event: z.literal("thinking.stop"),
    data: z.object({
      message_id: z.string(),
    }),
  }),

  z.object({
    event: z.literal("run.complete"),
    data: z.object({
      finalMessageId: z.string(),
    }),
  }),
  z.object({
    event: z.literal("run.aborted"),
    data: z.object({}),
  }),
  z.object({
    event: z.literal("run.failed"),
    data: z.object({
      error: z.string().optional(),
    }),
  }),
  z.object({
    event: z.literal("error"),
    data: z.object({
      message: z.string().optional(),
    }),
  }),

  z.object({
    event: z.literal("chat.title.created"),
    data: z.object({
      chatId: z.string(),
      title: z.string(),
    }),
  }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;
