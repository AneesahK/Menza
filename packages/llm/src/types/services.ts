import type Anthropic from "@anthropic-ai/sdk";

/**
 * Union of all Anthropic stream event types.
 * This is the canonical event format — all LLM services normalize to this.
 */
export type LLMStreamEvent = Anthropic.RawMessageStreamEvent;

export interface StreamCompletionParams {
  model: string;
  messages: Array<Anthropic.MessageParam>;
  system?: Array<Anthropic.TextBlockParam>;
  tools?: Array<Anthropic.Tool>;
  maxTokens: number;
  abortSignal?: AbortSignal;
}

export interface ILLMService {
  streamCompletion(
    params: StreamCompletionParams,
  ): AsyncGenerator<LLMStreamEvent>;
}
