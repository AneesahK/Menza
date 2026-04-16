import type { z } from "zod";

import type { Tool } from "@anthropic-ai/sdk/resources/messages.js";

/**
 * Result returned by a tool's execute() method.
 */
export type ToolCallResult = {
  /** Whether the agent should continue looping after this tool result */
  shouldRunAgain: boolean;
  /** Text output to include in the tool result message */
  output: string;
  /** Optional widget configs to attach to the tool result message */
  attachments?: Array<Record<string, unknown>>;
};

export interface ITool extends Omit<Tool, "input_schema"> {
  /** Zod schema for validating tool input (wrapped in `args` container) */
  inputSchema: z.ZodTypeAny;
  /** Execute the tool with parsed arguments */
  execute(args: Record<string, unknown>): Promise<ToolCallResult>;
}
