import type { StreamEmitter } from "../stream/emitter.js";
import type { StreamEvent } from "../stream/events.js";
import type { ITool } from "./tools.js";
import type { DbClient } from "@demo/db";
import type { MessageSelect } from "@demo/db/schema";

export type AgentMessage = MessageSelect;

export interface AgentContext {
  db: DbClient;
  userId: string;
  orgId: string;
  conversationId: string;
  parentConversationId?: string;
  runId: string;
  parentRunId?: string;
  streamEmitter: StreamEmitter;
  abortSignal?: AbortSignal;
}

export interface IAgent {
  run(): Promise<void>;
}

/** Used by nested agents to consume events from a child agent. */
export interface ChatAgent extends IAgent {
  runWithResultEvents(): AsyncGenerator<StreamEvent>;
  tools: Array<ITool>;
}
