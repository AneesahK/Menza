import { and, asc, desc, eq } from "drizzle-orm";

import { ExecSqlTool } from "../tools/exec-sql.js";
import { ShowWidgetTool, type ShowWidgetInput } from "../tools/show-widget.js";
import type { AgentContext } from "../types/agents.js";
import type { ToolCallResult } from "../types/tools.js";
import { BaseChatAgent } from "./base-chat-agent.js";
import { WidgetAgent } from "./widget-agent.js";
import type Anthropic from "@anthropic-ai/sdk";
import { conversationTable, messageTable } from "@demo/db/schema";
import { createID } from "@demo/db/utils";
import { MemoryService } from "../services/memory-service.js";

const DATA_AGENT_SYSTEM_PROMPT = `You are Menza, a helpful BI (business intelligence) and data analysis assistant. You help users explore, understand, and visualize their business data.

You have access to a DuckDB analytical database containing the user's business data. You can:
- Query the data using SQL (via the exec_sql tool)
- Create visualizations — charts, tables, and metric cards (via the show_widget tool)

Guidelines:
- When the user asks a data question, first explore the data to understand it, then answer clearly
- When creating visualizations, use the show_widget tool — do NOT try to render charts in text
- Use standard SQL syntax (DuckDB compatible)
- Be concise but thorough in your explanations
- If you make assumptions about the data, state them clearly
- Use one tool at a time — don't try to run multiple tools in parallel
- When showing results, explain the key insights and findings
- End your responses with 1-3 follow-up suggestion questions wrapped in <suggestion> tags

Example suggestion format:
<suggestion>What are the top 10 products by revenue?</suggestion>
<suggestion>How does this compare to last month?</suggestion>`;

const DATA_AGENT_CONTEXT_EXPLANATION = "data-agent-managed-context-v1";

interface DataAgentParams {
  ctx: AgentContext;
  dataSourceContext: string;
  queryFn: (sql: string) => Promise<Array<Record<string, unknown>>>;
}

/**
 * The main data analysis agent. Handles user conversations, SQL queries,
 * and widget creation via nested WidgetAgent.
 */
export class DataAgent {
  private readonly ctx: AgentContext;
  private readonly dataSourceContext: string;
  private readonly queryFn: (
    sql: string,
  ) => Promise<Array<Record<string, unknown>>>;

  constructor(params: DataAgentParams) {
    this.ctx = params.ctx;
    this.dataSourceContext = params.dataSourceContext;
    this.queryFn = params.queryFn;
  }

  /**
   * Refreshes the hidden run context message for this conversation.
   * Called on every run-agent job so memory edits are reflected in new user queries.
   */
  async createConversation(): Promise<void> {
    const contextMessage = await this.buildConversationContextMessage();

    const existingManaged = await this.ctx.db
      .select({ id: messageTable.id })
      .from(messageTable)
      .where(
        and(
          eq(messageTable.conversationId, this.ctx.conversationId),
          eq(messageTable.role, "system"),
          eq(messageTable.explanation, DATA_AGENT_CONTEXT_EXPLANATION),
        ),
      )
      .orderBy(asc(messageTable.createdAt))
      .limit(1);

    if (existingManaged[0]) {
      await this.ctx.db
        .update(messageTable)
        .set({
          message: contextMessage,
          runId: this.ctx.runId,
          updatedAt: new Date(),
        })
        .where(eq(messageTable.id, existingManaged[0].id));

      return;
    }

    // Backfill legacy conversations by reusing the first hidden system message.
    const legacySystemMessage = await this.ctx.db
      .select({ id: messageTable.id })
      .from(messageTable)
      .where(
        and(
          eq(messageTable.conversationId, this.ctx.conversationId),
          eq(messageTable.role, "system"),
          eq(messageTable.isVisible, false),
        ),
      )
      .orderBy(asc(messageTable.createdAt))
      .limit(1);

    if (legacySystemMessage[0]) {
      await this.ctx.db
        .update(messageTable)
        .set({
          message: contextMessage,
          explanation: DATA_AGENT_CONTEXT_EXPLANATION,
          runId: this.ctx.runId,
          updatedAt: new Date(),
        })
        .where(eq(messageTable.id, legacySystemMessage[0].id));

      return;
    }

    await this.ctx.db.insert(messageTable).values({
      id: createID("message"),
      userId: this.ctx.userId,
      orgId: this.ctx.orgId,
      conversationId: this.ctx.conversationId,
      message: contextMessage,
      role: "system",
      isVisible: false,
      explanation: DATA_AGENT_CONTEXT_EXPLANATION,
      runId: this.ctx.runId,
    });
  }

  private async buildConversationContextMessage(): Promise<string> {
    // Fetch user memories and inject them into the system prompt
    let userContextMessage = "";
    try {
      // Get the latest user message to use as the query for memory search
      const latestUserMessage = await this.ctx.db
        .select()
        .from(messageTable)
        .where(
          and(
            eq(messageTable.conversationId, this.ctx.conversationId),
            eq(messageTable.role, "user"),
          ),
        )
        .orderBy(desc(messageTable.createdAt))
        .limit(1);

      if (latestUserMessage[0]?.message) {
        const memoryService = new MemoryService(this.ctx.db);
        const relevantMemories = await memoryService.searchMemories({
          userId: this.ctx.userId,
          query: latestUserMessage[0].message,
          limit: 10,
        });

        // Only inject memories if we found any with reasonable similarity
        const filteredMemories = relevantMemories.filter((m) => m.similarity > 0.5);
        if (filteredMemories.length > 0) {
          userContextMessage = memoryService.formatForPrompt(filteredMemories, 500);
          userContextMessage += "\n\n";
        }
      }
    } catch (error) {
      console.error("Failed to fetch user memories:", error);
      // Continue without memories if there's an error
    }

    return `${userContextMessage}<data_source_context>\n${this.dataSourceContext}\n</data_source_context>`;
  }

  async run(): Promise<void> {
    const { streamEmitter } = this.ctx;

    const showWidgetTool = new ShowWidgetTool(
      (
        toolCtx: AgentContext,
        input: ShowWidgetInput,
      ): Promise<ToolCallResult> => {
        return this.handleShowWidget(toolCtx, input);
      },
    );
    showWidgetTool.setContext(this.ctx);

    const tools = [new ExecSqlTool(this.queryFn), showWidgetTool];

    const systemPrompt: Array<Anthropic.TextBlockParam> = [
      { type: "text", text: DATA_AGENT_SYSTEM_PROMPT },
    ];

    const agent = new BaseChatAgent({
      ctx: this.ctx,
      systemPrompt,
      tools,
    });

    try {
      await this.ctx.db
        .update(conversationTable)
        .set({ status: "in_progress", runId: this.ctx.runId })
        .where(eq(conversationTable.id, this.ctx.conversationId));

      for await (const event of agent.runWithResultEvents()) {
        await streamEmitter.emit(event);
      }

      await this.ctx.db
        .update(conversationTable)
        .set({ status: "completed" })
        .where(eq(conversationTable.id, this.ctx.conversationId));
    } catch (error) {
      console.error("DataAgent run failed:", error);

      await this.ctx.db
        .update(conversationTable)
        .set({ status: "failed" })
        .where(eq(conversationTable.id, this.ctx.conversationId));

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await streamEmitter.emit({
        event: "run.failed",
        data: { error: errorMessage },
      });
    }
  }

  private async handleShowWidget(
    _toolCtx: AgentContext,
    input: ShowWidgetInput,
  ): Promise<ToolCallResult> {
    const widgetAgent = new WidgetAgent({
      ctx: this.ctx,
      widgetType: input.widget_type,
      instruction: input.widget_description,
      dataSourceContext: this.dataSourceContext,
      queryFn: this.queryFn,
    });

    const result = await widgetAgent.createWidget();

    if (result) {
      return {
        shouldRunAgain: true,
        output: `Widget created successfully. Widget ID: ${result.widgetId}`,
        attachments: [
          result.widgetConfig as unknown as Record<string, unknown>,
        ],
      };
    }

    return {
      shouldRunAgain: true,
      output:
        "Failed to create widget. Please try again with a different description or approach.",
    };
  }
}
