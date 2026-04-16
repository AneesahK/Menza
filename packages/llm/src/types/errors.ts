export class LLMContextLimitExceededError extends Error {
  public readonly inputTokens: number;
  public readonly maxTokens: number;

  constructor(inputTokens: number, maxTokens: number) {
    super(
      `Context limit exceeded: ${inputTokens} input tokens exceeds ${maxTokens} max tokens`,
    );
    this.name = "LLMContextLimitExceededError";
    this.inputTokens = inputTokens;
    this.maxTokens = maxTokens;
  }
}

export class LLMOverloadedError extends Error {
  constructor(message?: string) {
    super(message ?? "LLM service is overloaded");
    this.name = "LLMOverloadedError";
  }
}

export class RunAbortError extends Error {
  public readonly runId: string;

  constructor(runId: string, message?: string) {
    super(message ?? `Run ${runId} was aborted`);
    this.name = "RunAbortError";
    this.runId = runId;
  }
}
