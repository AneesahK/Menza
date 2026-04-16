import { and, asc, eq } from "drizzle-orm";

import { parseToolCallArgs } from "../helpers/parse-tool-call-args.js";
import { AnthropicService } from "../services/anthropic.js";
import type { StreamEvent } from "../stream/events.js";
import type { AgentContext } from "../types/agents.js";
import { RunAbortError } from "../types/errors.js";
import type { ILLMService } from "../types/services.js";
import type { ITool, ToolCallResult } from "../types/tools.js";
import type Anthropic from "@anthropic-ai/sdk";
import { messageTable } from "@demo/db/schema";
import { createID } from "@demo/db/utils";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 16384;

interface BaseChatAgentParams {
  ctx: AgentContext;
  systemPrompt: Array<Anthropic.TextBlockParam>;
  tools: Array<ITool>;
  model?: string;
  maxTokens?: number;
  llmService?: ILLMService;
}

export class BaseChatAgent {
  protected readonly ctx: AgentContext;
  protected readonly systemPrompt: Array<Anthropic.TextBlockParam>;
  readonly tools: Array<ITool>;
  protected readonly model: string;
  protected readonly maxTokens: number;
  protected readonly llmService: ILLMService;

  constructor(params: BaseChatAgentParams) {
    this.ctx = params.ctx;
    this.systemPrompt = params.systemPrompt;
    this.tools = params.tools;
    this.model = params.model ?? DEFAULT_MODEL;
    this.maxTokens = params.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.llmService =
      params.llmService ??
      new AnthropicService(process.env.ANTHROPIC_API_KEY ?? "");
  }

  /**
   * Run the agent loop, yielding stream events.
   * Used by parent agents (e.g. DataAgent calling WidgetAgent) to
   * consume events from a nested agent.
   */
  // biome-ignore lint/suspicious/useAwait: async generator delegates to async generator via yield*
  async *runWithResultEvents(): AsyncGenerator<StreamEvent> {
    yield* this.handleLlmStream();
  }

  protected async *handleLlmStream(): AsyncGenerator<StreamEvent> {
    let shouldRunAgain = true;
    let iterationCount = 0;
    const maxIterations = 25;

    while (shouldRunAgain && iterationCount < maxIterations) {
      iterationCount++;
      shouldRunAgain = false;

      if (this.ctx.abortSignal?.aborted) {
        yield { event: "run.aborted", data: {} };
        return;
      }

      const messages = await this.fetchMessages();
      const anthropicMessages = this.convertToAnthropicMessages(messages);

      const anthropicTools = AnthropicService.convertToolsToAnthropic(
        this.tools,
      );

      const currentMessageId = createID("message");
      let currentText = "";
      let currentToolCalls: Array<{
        id: string;
        name: string;
        rawArgs: string;
      }> = [];
      let hasStartedMessage = false;
      let isThinking = false;
      const thinkingBlocks: Array<{
        type: "thinking";
        thinking: string;
        signature?: string;
      }> = [];
      let currentThinkingText = "";
      let currentThinkingSignature = "";
      let currentBlockType: "thinking" | "text" | "tool_use" | null = null;

      try {
        const stream = this.llmService.streamCompletion({
          model: this.model,
          messages: anthropicMessages,
          system: this.systemPrompt,
          tools: anthropicTools.length > 0 ? anthropicTools : undefined,
          maxTokens: this.maxTokens,
          abortSignal: this.ctx.abortSignal,
        });

        for await (const event of stream) {
          switch (event.type) {
            case "content_block_start": {
              if (event.content_block.type === "thinking") {
                currentBlockType = "thinking";
                isThinking = true;
                currentThinkingText = "";
                currentThinkingSignature = "";
                yield {
                  event: "thinking.start",
                  data: { message_id: currentMessageId },
                };
              } else if (event.content_block.type === "text") {
                currentBlockType = "text";
                if (!hasStartedMessage) {
                  hasStartedMessage = true;
                  yield {
                    event: "message.start",
                    data: { id: currentMessageId, message: "" },
                  };
                }
              } else if (event.content_block.type === "tool_use") {
                currentBlockType = "tool_use";
                const toolBlock = event.content_block;
                currentToolCalls.push({
                  id: toolBlock.id,
                  name: toolBlock.name,
                  rawArgs: "",
                });
                yield {
                  event: "tool.start",
                  data: {
                    message_id: currentMessageId,
                    tool_call_id: toolBlock.id,
                    function_name: toolBlock.name,
                  },
                };
              }
              break;
            }

            case "content_block_delta": {
              if (event.delta.type === "thinking_delta") {
                currentThinkingText += event.delta.thinking;
              } else if (event.delta.type === "text_delta") {
                currentText += event.delta.text;
                yield {
                  event: "message.delta",
                  data: { id: currentMessageId, message: event.delta.text },
                };
              } else if (event.delta.type === "input_json_delta") {
                const lastTool = currentToolCalls[currentToolCalls.length - 1];
                if (lastTool) {
                  lastTool.rawArgs += event.delta.partial_json;
                  yield {
                    event: "tool.delta",
                    data: {
                      message_id: currentMessageId,
                      tool_call_id: lastTool.id,
                      function_name: lastTool.name,
                      arguments: lastTool.rawArgs,
                      delta: event.delta.partial_json,
                    },
                  };
                }
              } else if (event.delta.type === "signature_delta") {
                currentThinkingSignature += event.delta.signature;
              }
              break;
            }

            case "content_block_stop": {
              if (currentBlockType === "thinking" && isThinking) {
                isThinking = false;
                thinkingBlocks.push({
                  type: "thinking",
                  thinking: currentThinkingText,
                  ...(currentThinkingSignature
                    ? { signature: currentThinkingSignature }
                    : {}),
                });
                yield {
                  event: "thinking.stop",
                  data: { message_id: currentMessageId },
                };
              } else if (currentBlockType === "tool_use") {
                // Emit tool.complete only for tool_use blocks
                const lastTool = currentToolCalls[currentToolCalls.length - 1];
                if (lastTool) {
                  yield {
                    event: "tool.complete",
                    data: {
                      message_id: currentMessageId,
                      tool_call_id: lastTool.id,
                      function_name: lastTool.name,
                      arguments: lastTool.rawArgs,
                    },
                  };
                }
              }

              currentBlockType = null;
              break;
            }

            case "message_stop": {
              break;
            }
          }
        }
      } catch (error) {
        if (error instanceof RunAbortError) {
          yield { event: "run.aborted", data: {} };
          return;
        }
        throw error;
      }

      const toolCallsForDb =
        currentToolCalls.length > 0
          ? currentToolCalls.map((tc) => ({
              id: tc.id,
              function: { name: tc.name, arguments: tc.rawArgs },
            }))
          : undefined;

      await this.ctx.db.insert(messageTable).values({
        id: currentMessageId,
        userId: this.ctx.userId,
        orgId: this.ctx.orgId,
        conversationId: this.ctx.conversationId,
        message: currentText || null,
        role: "assistant",
        isVisible: true,
        toolCalls: toolCallsForDb,
        thinkingBlocks: thinkingBlocks.length > 0 ? thinkingBlocks : undefined,
        runId: this.ctx.runId,
        parentRunId: this.ctx.parentRunId,
      });

      if (currentToolCalls.length > 0) {
        for (const toolCall of currentToolCalls) {
          const tool = this.tools.find((t) => t.name === toolCall.name);
          if (!tool) {
            // Unknown tool — save error result and continue
            await this.saveToolResult(
              toolCall.id,
              toolCall.name,
              `Unknown tool: ${toolCall.name}`,
              currentMessageId,
            );
            shouldRunAgain = true;
            continue;
          }

          let result: ToolCallResult;
          try {
            const parsedArgs = parseToolCallArgs(
              toolCall.rawArgs,
              tool.inputSchema,
            );
            result = await tool.execute(parsedArgs);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            result = {
              shouldRunAgain: true,
              output: `Tool execution error: ${errorMessage}`,
            };
          }

          await this.saveToolResult(
            toolCall.id,
            toolCall.name,
            result.output,
            currentMessageId,
            result.attachments,
          );

          yield {
            event: "tool.result",
            data: {
              output: {
                message_id: currentMessageId,
                tool_call_name: toolCall.name,
                tool_call_id: toolCall.id,
                attachments: result.attachments
                  ? JSON.stringify(result.attachments)
                  : undefined,
                message: result.output,
              },
            },
          };

          if (result.shouldRunAgain) {
            shouldRunAgain = true;
          }
        }

        currentToolCalls = [];
      }

      if (!shouldRunAgain) {
        yield {
          event: "run.complete",
          data: { finalMessageId: currentMessageId },
        };
      }
    }

    // If we hit max iterations, emit completion anyway
    if (iterationCount >= maxIterations) {
      console.warn(
        `Agent hit max iterations (${maxIterations}) for conversation ${this.ctx.conversationId}`,
      );
      yield {
        event: "run.complete",
        data: { finalMessageId: createID("message") },
      };
    }
  }

  private async saveToolResult(
    toolCallId: string,
    _toolName: string,
    output: string,
    _parentMessageId: string,
    attachments?: Array<Record<string, unknown>>,
  ): Promise<void> {
    await this.ctx.db.insert(messageTable).values({
      id: createID("message"),
      userId: this.ctx.userId,
      orgId: this.ctx.orgId,
      conversationId: this.ctx.conversationId,
      message: output,
      attachments: attachments ? JSON.stringify(attachments) : "[]",
      role: "tool",
      isVisible: !!attachments && attachments.length > 0,
      toolCallId,
      runId: this.ctx.runId,
      parentRunId: this.ctx.parentRunId,
    });
  }

  private fetchMessages(): Promise<Array<typeof messageTable.$inferSelect>> {
    return this.ctx.db
      .select()
      .from(messageTable)
      .where(and(eq(messageTable.conversationId, this.ctx.conversationId)))
      .orderBy(asc(messageTable.createdAt));
  }

  /**
   * Convert DB messages to Anthropic message format.
   * Groups consecutive tool results under the same assistant message.
   */
  private convertToAnthropicMessages(
    messages: Array<typeof messageTable.$inferSelect>,
  ): Array<Anthropic.MessageParam> {
    const result: Array<Anthropic.MessageParam> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        // System messages are injected as user messages with context framing
        result.push({
          role: "user",
          content: msg.message ?? "",
        });
        // Add a placeholder assistant response
        result.push({
          role: "assistant",
          content: "Understood.",
        });
        continue;
      }

      if (msg.role === "user") {
        result.push({
          role: "user",
          content: msg.message ?? "",
        });
        continue;
      }

      if (msg.role === "assistant") {
        const content: Array<Anthropic.ContentBlockParam> = [];

        if (msg.thinkingBlocks) {
          for (const block of msg.thinkingBlocks) {
            if (block.type === "thinking") {
              content.push({
                type: "thinking",
                thinking: block.thinking,
                signature: block.signature ?? "",
              });
            }
          }
        }

        if (msg.message) {
          content.push({ type: "text", text: msg.message });
        }

        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            let inputObj: Record<string, unknown>;
            try {
              inputObj = tc.function.arguments
                ? (JSON.parse(tc.function.arguments) as Record<string, unknown>)
                : {};
            } catch {
              inputObj = {};
            }

            content.push({
              type: "tool_use",
              id: tc.id,
              name: tc.function.name,
              input: inputObj,
            });
          }
        }

        if (content.length > 0) {
          result.push({ role: "assistant", content });
        }
        continue;
      }

      if (msg.role === "tool") {
        // Tool results are added as user messages with tool_result content
        result.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.toolCallId ?? "",
              content: msg.message ?? "",
            },
          ],
        });
      }
    }

    return result;
  }
}
