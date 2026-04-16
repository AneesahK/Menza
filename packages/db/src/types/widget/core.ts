import { z } from "zod";

import { agIntegratedChartConfigSchema } from "./ag.js";
import { itemSchemaBase, itemTypes } from "./common.js";
import { metricItemConfigSchema } from "./metric-config.js";
import { tableItemConfigSchema } from "./table-config.js";

export const itemConfigSchema = z
  .discriminatedUnion("type", [
    metricItemConfigSchema.extend({ id: z.string().nullish() }),
    tableItemConfigSchema.extend({ id: z.string().nullish() }),
    agIntegratedChartConfigSchema.extend({ id: z.string().nullish() }),
  ])
  .describe(
    "This config is a discriminated union based on the 'type' of the item.",
  );

const completedItem = z.object({
  ...itemSchemaBase.shape,
  status: z.literal("completed"),
  config: itemConfigSchema,
});
export type CompletedItem = z.infer<typeof completedItem>;

const updatingItem = z.object({
  ...itemSchemaBase.shape,
  status: z.literal("updating"),
  config: z.union([
    itemConfigSchema,
    z.object({
      type: z.enum(itemTypes),
    }),
  ]),
  currentAction: z.string().optional(),
});
export type UpdatingItem = z.infer<typeof updatingItem>;

const inProgressItem = z.object({
  ...itemSchemaBase.shape,
  status: z.literal("in_progress"),
  config: z.object({
    type: z.enum(itemTypes),
  }),
  currentAction: z.string().optional(),
});
export type InProgressItem = z.infer<typeof inProgressItem>;

const failedItem = z.object({
  ...itemSchemaBase.shape,
  status: z.literal("failed"),
  config: z.union([
    itemConfigSchema,
    z.object({
      type: z.enum(itemTypes),
    }),
  ]),
});
export type FailedItem = z.infer<typeof failedItem>;

export const coreItemSchema = z.discriminatedUnion("status", [
  inProgressItem,
  updatingItem,
  failedItem,
  completedItem,
]);

export type CoreItem = z.infer<typeof coreItemSchema>;
export type ItemConfig = z.infer<typeof itemConfigSchema>;

const dataRequiringItemConfigSchema = z.discriminatedUnion("type", [
  metricItemConfigSchema,
  tableItemConfigSchema,
  agIntegratedChartConfigSchema,
]);

export type DataRequiringItemConfig = z.infer<
  typeof dataRequiringItemConfigSchema
>;
