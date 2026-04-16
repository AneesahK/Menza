import { z } from "zod";

export const itemTypes = [
  "metric",
  "table",
  "ag-integrated",
] as const;

export type ItemTypeNew = (typeof itemTypes)[number];

export const itemStatuses = [
  "in_progress",
  "completed",
  "updating",
  "failed",
] as const;
export type ItemStatus = (typeof itemStatuses)[number];

export const itemSchemaBase = z.object({
  version: z.literal(2),
  id: z.string().describe("unique identifier for the item"),
  explanation: z.string().nullish().describe("the explanation of the item"),
  aiPrompt: z
    .string()
    .nullish()
    .describe("the users prompt to guide the output of this particular item"),
  status: z.enum(itemStatuses).describe("the status of the item"),
  isPinned: z.boolean().default(false),
  conversationId: z.string().nullish(),
});
