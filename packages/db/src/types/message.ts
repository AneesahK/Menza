import { z } from "zod";

import { stringToJSONSchema } from "../zod.js";
import { agIntegratedChartConfigSchema } from "./widget/ag.js";
import { metricItemConfigSchema } from "./widget/metric-config.js";
import { tableItemConfigSchema } from "./widget/table-config.js";

export const toolCallSchema = z.object({
  id: z.string(),
  function: z.object({
    name: z.string(),
    arguments: z.string().optional(),
  }),
});
export type ToolCall = z.infer<typeof toolCallSchema>;

export const thinkingBlockSchema = z.object({
  type: z.literal("thinking"),
  thinking: z.string(),
  signature: z.string().optional(),
});

export const redactedThinkingBlockSchema = z.object({
  type: z.literal("redacted_thinking"),
  data: z.string(),
});

export const thinkingContentBlockSchema = z.discriminatedUnion("type", [
  thinkingBlockSchema,
  redactedThinkingBlockSchema,
]);

export type ThinkingBlock = z.infer<typeof thinkingBlockSchema>;
export type RedactedThinkingBlock = z.infer<typeof redactedThinkingBlockSchema>;
export type ThinkingContentBlock = z.infer<typeof thinkingContentBlockSchema>;

export const messageAttachmentSchema = z.discriminatedUnion("type", [
  metricItemConfigSchema.extend({ id: z.string().nullish() }),
  tableItemConfigSchema.extend({ id: z.string().nullish() }),
  agIntegratedChartConfigSchema.extend({ id: z.string().nullish() }),
]);

export const attachmentSchema = stringToJSONSchema.pipe(
  z.array(messageAttachmentSchema).catch([]),
);
export type Attachment = z.infer<typeof messageAttachmentSchema>;
