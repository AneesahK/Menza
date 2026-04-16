import { z } from "zod";

export const metricItemConfigSchema = z.object({
  type: z.literal("metric"),
  title: z
    .string()
    .describe("The short title that describes the metric widget text."),
  subtitle: z.string().nullish(),
  text: z.string().describe(
    `The template string of the metric to be displayed in the widget. The values of \`data\` will be passed as arguments to fill in and resolve the template. Arguments must be named \`arg1\`, \`arg2\`, etc. in order.

Available template functions:
- formatNumber(value, decimals = 0)
- formatCurrency(value, currency = "£")
- calculatePercent(newVal, oldVal, decimals = 1)
- compareWithArrow(current, previous) → "↑" | "↓"
`,
  ),
  subtext: z
    .string()
    .nullish()
    .describe(
      "An optional subtext template string providing context (e.g. percentage change).",
    ),
  query: z
    .string()
    .describe(
      `This query will be executed against a DuckDB database. Use standard SQL syntax.
The output must return only a single row, where each column becomes arg1, arg2, etc. in order.`,
    )
    .optional(),
  queryLastFetched: z.coerce.date().nullish(),
  data: z
    .array(z.union([z.string(), z.number()]))
    .describe(
      "The values passed as arguments into the template strings, in order.",
    )
    .default([]),
  lastModified: z.coerce.date().nullish(),
});

export type MetricItemConfig = z.infer<typeof metricItemConfigSchema>;
