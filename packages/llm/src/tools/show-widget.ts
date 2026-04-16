import { z } from "zod";

import type { AgentContext } from "../types/agents.js";
import type { ITool, ToolCallResult } from "../types/tools.js";

const showWidgetInputSchema = z.object({
  widget_type: z
    .enum(["ag-integrated", "table", "metric"])
    .describe(
      "The type of widget to create. Use 'ag-integrated' for charts, 'table' for data tables, 'metric' for single KPI values.",
    ),
  widget_description: z
    .string()
    .describe(
      "A detailed description of the widget to create, including what data to show, how to structure it, and any specific formatting requirements.",
    ),
});

export type ShowWidgetInput = z.infer<typeof showWidgetInputSchema>;

/**
 * Tool that spawns a WidgetAgent to create a chart, table, or metric widget.
 * The widget agent runs as a nested agent with its own conversation.
 *
 * The createWidgetFn is injected to avoid circular dependencies —
 * the DataAgent provides it at construction time.
 */
export class ShowWidgetTool implements ITool {
  name = "show_widget";
  description = `Create a data visualization widget (chart, table, or metric card) to display to the user.
Use this when the user asks to see, visualize, or chart data, or when a visual would enhance your answer.
A separate visualization agent will handle the SQL queries and chart configuration.
You provide the widget type and a description of what to show.`;
  inputSchema = showWidgetInputSchema;

  private readonly createWidgetFn: (
    ctx: AgentContext,
    input: ShowWidgetInput,
  ) => Promise<ToolCallResult>;

  constructor(
    createWidgetFn: (
      ctx: AgentContext,
      input: ShowWidgetInput,
    ) => Promise<ToolCallResult>,
  ) {
    this.createWidgetFn = createWidgetFn;
  }

  /** Not used directly — the DataAgent provides context via createWidgetFn */
  private ctx: AgentContext | null = null;

  /** Set the agent context (called by DataAgent before execution) */
  setContext(ctx: AgentContext): void {
    this.ctx = ctx;
  }

  execute(args: Record<string, unknown>): Promise<ToolCallResult> {
    const parsed = showWidgetInputSchema.parse(args);

    if (!this.ctx) {
      return Promise.resolve({
        shouldRunAgain: true,
        output: "Internal error: agent context not set on ShowWidgetTool",
      });
    }

    return this.createWidgetFn(this.ctx, parsed);
  }
}
