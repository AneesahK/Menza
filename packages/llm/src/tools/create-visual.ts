import { z } from "zod";

import type { ITool, ToolCallResult } from "../types/tools.js";
import { agIntegratedChartConfigSchema } from "@demo/db/types/widget/ag";
import { metricItemConfigSchema } from "@demo/db/types/widget/metric-config";
import { tableItemConfigSchema } from "@demo/db/types/widget/table-config";

const createVisualInputSchema = z.object({
  visualization: z
    .discriminatedUnion("type", [
      agIntegratedChartConfigSchema.omit({
        data: true,
        queryLastFetched: true,
        lastModified: true,
        chartModel: true,
      }),
      tableItemConfigSchema.omit({
        data: true,
        queryLastFetched: true,
        lastModified: true,
      }),
      metricItemConfigSchema.omit({
        data: true,
        queryLastFetched: true,
        lastModified: true,
      }),
    ])
    .describe(
      "The widget configuration. Data will be fetched automatically from the query.",
    ),
});

export type CreateVisualInput = z.infer<typeof createVisualInputSchema>;

/**
 * Tool used by the WidgetAgent to output the final widget configuration.
 * Executes the widget's SQL query and attaches the fetched data.
 */
export class CreateVisualTool implements ITool {
  name = "create_visual";
  description = `Output the final visualization configuration. Include a SQL query to fetch the data.
The query will be executed automatically and the data will be attached to the config.
This tool should be called exactly once as the final step of widget creation.`;
  inputSchema = createVisualInputSchema;

  private readonly queryFn: (
    sql: string,
  ) => Promise<Array<Record<string, unknown>>>;

  constructor(
    queryFn: (sql: string) => Promise<Array<Record<string, unknown>>>,
  ) {
    this.queryFn = queryFn;
  }

  async execute(args: Record<string, unknown>): Promise<ToolCallResult> {
    const parsed = createVisualInputSchema.parse(args);
    const config = parsed.visualization;

    let data: Array<Record<string, unknown>> = [];
    if ("query" in config && config.query) {
      try {
        data = await this.queryFn(config.query);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          shouldRunAgain: true,
          output: `Failed to execute widget query: ${errorMessage}. Please fix the query and try again.`,
        };
      }
    }

    const completeConfig = {
      ...config,
      data,
      queryLastFetched: new Date().toISOString(),
    };

    return {
      shouldRunAgain: false,
      output: "Widget created successfully.",
      attachments: [completeConfig],
    };
  }
}
