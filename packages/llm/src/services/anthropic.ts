import { generateToolJsonSchema } from "../helpers/generate-json-schema.js";
import {
  LLMContextLimitExceededError,
  LLMOverloadedError,
  RunAbortError,
} from "../types/errors.js";
import type {
  ILLMService,
  LLMStreamEvent,
  StreamCompletionParams,
} from "../types/services.js";
import type { ITool } from "../types/tools.js";
import Anthropic from "@anthropic-ai/sdk";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

/**
 * Anthropic LLM service.
 * Wraps the Anthropic SDK to provide streaming completions with:
 * - Tool schema conversion (Zod → JSON Schema with `args` wrapper)
 * - Cache control on system prompt + last tool + last message
 * - Automatic retry with exponential backoff
 * - Context limit and overload detection
 * - Abort signal support
 */
export class AnthropicService implements ILLMService {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Convert internal tool definitions to Anthropic's tool format.
   * Wraps each tool's Zod schema in the `args` container pattern and
   * adds cache control to the last tool definition.
   */
  static convertToolsToAnthropic(tools: Array<ITool>): Array<Anthropic.Tool> {
    return tools.map((tool, index) => {
      const isLast = index === tools.length - 1;
      const jsonSchema = generateToolJsonSchema(tool.inputSchema);

      const inputSchema = {
        type: "object" as const,
        properties: {
          args: {
            $ref: "#/definitions/args",
          },
        },
        additionalProperties: false,
        definitions: jsonSchema,
      } satisfies Anthropic.Tool.InputSchema;

      return {
        name: tool.name,
        description: tool.description,
        input_schema: inputSchema,
        ...(isLast ? { cache_control: { type: "ephemeral" as const } } : {}),
      };
    });
  }

  /** Applies cache control to the last message for prompt caching. */
  static convertMessages(
    messages: Array<Anthropic.MessageParam>,
  ): Array<Anthropic.MessageParam> {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]!;
      if (typeof lastMsg.content === "string") {
        messages[messages.length - 1] = {
          ...lastMsg,
          content: [
            {
              type: "text",
              text: lastMsg.content,
              cache_control: { type: "ephemeral" },
            },
          ],
        };
      } else if (Array.isArray(lastMsg.content) && lastMsg.content.length > 0) {
        const lastBlock = lastMsg.content[lastMsg.content.length - 1]!;
        lastMsg.content[lastMsg.content.length - 1] = {
          ...lastBlock,
          cache_control: { type: "ephemeral" },
        } as typeof lastBlock;
      }
    }

    return messages;
  }

  async *streamCompletion(
    params: StreamCompletionParams,
  ): AsyncGenerator<LLMStreamEvent> {
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      try {
        const messages = AnthropicService.convertMessages(
          structuredClone(params.messages),
        );

        const system = params.system?.map((block, index) => {
          if (index === params.system!.length - 1) {
            return {
              ...block,
              cache_control: { type: "ephemeral" as const },
            };
          }
          return block;
        });

        const stream = this.client.messages.stream({
          model: params.model,
          max_tokens: params.maxTokens,
          messages,
          system,
          tools: params.tools,
          thinking: { type: "enabled", budget_tokens: 10_000 },
          tool_choice: { type: "auto", disable_parallel_tool_use: true },
        });

        if (params.abortSignal) {
          params.abortSignal.addEventListener(
            "abort",
            () => {
              void stream.abort();
            },
            { once: true },
          );
        }

        for await (const event of stream) {
          yield event;
        }

        return;
      } catch (error) {
        if (params.abortSignal?.aborted) {
          throw new RunAbortError("unknown", "Run was aborted");
        }

        if (
          error instanceof Anthropic.BadRequestError &&
          typeof error.message === "string" &&
          error.message.includes("prompt is too long")
        ) {
          throw new LLMContextLimitExceededError(0, 0);
        }

        if (error instanceof Anthropic.APIError && error.status === 529) {
          if (retryCount >= MAX_RETRIES) {
            throw new LLMOverloadedError();
          }
          retryCount++;
          const delay = INITIAL_RETRY_DELAY * 2 ** (retryCount - 1);
          console.warn(
            `Anthropic overloaded, retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (error instanceof Anthropic.RateLimitError) {
          if (retryCount >= MAX_RETRIES) {
            throw error;
          }
          retryCount++;
          const delay = INITIAL_RETRY_DELAY * 2 ** (retryCount - 1);
          console.warn(
            `Rate limited, retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
  }
}
