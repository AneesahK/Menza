import { eq } from "drizzle-orm";

import { CreateVisualTool } from "../tools/create-visual.js";
import { ExecSqlTool } from "../tools/exec-sql.js";
import type { AgentContext } from "../types/agents.js";
import { BaseChatAgent } from "./base-chat-agent.js";
import type Anthropic from "@anthropic-ai/sdk";
import { conversationTable, messageTable, widgetTable } from "@demo/db/schema";
import type { ItemConfig } from "@demo/db/types/widget/core";
import { createID } from "@demo/db/utils";

const WIDGET_SYSTEM_PROMPT = `You are a data visualization expert. Your job is to create a single widget (chart, table, or metric) based on the user's request.

You have access to a DuckDB analytical database with business data. Use the exec_sql tool to explore the data and understand the schema, then use create_visual to output the final widget configuration.

Workflow:
1. Use exec_sql to explore the relevant tables and understand the data structure
2. Use exec_sql to prototype your query and verify the data looks correct
3. Use create_visual to output the final widget configuration with the query

Important guidelines:
- Always explore the data first before creating the visualization
- Use descriptive column aliases in your SQL queries
- For charts, structure data with one x-axis column and separate columns for each series
- For tables, include all relevant columns with proper header names
- For metrics, ensure your query returns exactly one row
- Use standard SQL syntax (DuckDB compatible)
- Do NOT use matplotlib, plotly, or any other charting library — only use create_visual`;

interface WidgetAgentParams {
  ctx: AgentContext;
  widgetType: string;
  instruction: string;
  dataSourceContext: string;
  queryFn: (sql: string) => Promise<Array<Record<string, unknown>>>;
}

/**
 * Creates a single widget (chart, table, or metric).
 * Runs as a nested agent with its own child conversation.
 */
export class WidgetAgent {
  private readonly ctx: AgentContext;
  private readonly widgetType: string;
  private readonly instruction: string;
  private readonly dataSourceContext: string;
  private readonly queryFn: (
    sql: string,
  ) => Promise<Array<Record<string, unknown>>>;

  constructor(params: WidgetAgentParams) {
    this.ctx = params.ctx;
    this.widgetType = params.widgetType;
    this.instruction = params.instruction;
    this.dataSourceContext = params.dataSourceContext;
    this.queryFn = params.queryFn;
  }

  async createWidget(): Promise<{
    widgetConfig: ItemConfig;
    widgetId: string;
  } | null> {
    const childConversationId = createID("chat");
    const widgetId = createID("widget");
    const runId = createID("run");

    await this.ctx.db.insert(conversationTable).values({
      id: childConversationId,
      userId: this.ctx.userId,
      orgId: this.ctx.orgId,
      parentConversationId: this.ctx.conversationId,
      agentType: "widget-agent",
      status: "in_progress",
      runId,
    });

    await this.ctx.db.insert(messageTable).values({
      id: createID("message"),
      userId: this.ctx.userId,
      orgId: this.ctx.orgId,
      conversationId: childConversationId,
      message: `<data_source_context>\n${this.dataSourceContext}\n</data_source_context>`,
      role: "system",
      isVisible: false,
      runId,
    });

    await this.ctx.db.insert(messageTable).values({
      id: createID("message"),
      userId: this.ctx.userId,
      orgId: this.ctx.orgId,
      conversationId: childConversationId,
      message: `Create a ${this.widgetType} widget: ${this.instruction}`,
      role: "user",
      isVisible: false,
      runId,
    });

    await this.ctx.db.insert(widgetTable).values({
      id: widgetId,
      userId: this.ctx.userId,
      orgId: this.ctx.orgId,
      conversationId: this.ctx.conversationId,
      status: "in_progress",
      aiPrompt: this.instruction,
    });

    const tools = [
      new ExecSqlTool(this.queryFn),
      new CreateVisualTool(this.queryFn),
    ];

    const systemPrompt: Array<Anthropic.TextBlockParam> = [
      { type: "text", text: WIDGET_SYSTEM_PROMPT },
    ];

    const agent = new BaseChatAgent({
      ctx: {
        ...this.ctx,
        conversationId: childConversationId,
        runId,
        parentRunId: this.ctx.runId,
      },
      systemPrompt,
      tools,
    });

    let widgetConfig: ItemConfig | null = null;

    for await (const event of agent.runWithResultEvents()) {
      if (
        event.event === "tool.result" &&
        event.data.output.tool_call_name === "create_visual" &&
        event.data.output.attachments
      ) {
        try {
          const attachments = JSON.parse(
            event.data.output.attachments,
          ) as Array<Record<string, unknown>>;
          if (attachments.length > 0) {
            widgetConfig = attachments[0] as ItemConfig;
          }
        } catch {
          // JSON parse failure — skip
        }
      }
    }

    if (widgetConfig) {
      await this.ctx.db
        .update(widgetTable)
        .set({
          config: widgetConfig,
          status: "completed",
        })
        .where(eq(widgetTable.id, widgetId));

      await this.ctx.db
        .update(conversationTable)
        .set({ status: "completed" })
        .where(eq(conversationTable.id, childConversationId));

      return { widgetConfig, widgetId };
    }

    await this.ctx.db
      .update(widgetTable)
      .set({ status: "failed" })
      .where(eq(widgetTable.id, widgetId));

    await this.ctx.db
      .update(conversationTable)
      .set({ status: "failed" })
      .where(eq(conversationTable.id, childConversationId));

    return null;
  }
}
