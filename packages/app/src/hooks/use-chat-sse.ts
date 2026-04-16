"use client";

import { useCallback, useEffect, useRef } from "react";

import { api } from "@/trpc/react";
import type { MessageFrontEnd } from "@demo/db/schema";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";

export function useChatSSE(
  conversationId: string | null,
  opts: {
    onTitleCreated?: (title: string) => void;
    onRunComplete?: () => void;
    onRunFailed?: (error?: string) => void;
  } = {},
) {
  const apiUtils = api.useUtils();
  const eventSourceRef = useRef<
    import("eventsource-client").EventSourceClient | null
  >(null);

  // Accumulated message text — scoped to the SSE connection closure
  const accumulatedMessageRef = useRef("");
  const currentMessageIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    accumulatedMessageRef.current = "";
    currentMessageIdRef.current = null;
  }, []);

  // Stable refs for opts callbacks so we don't re-connect on every render
  const onRunCompleteRef = useRef(opts.onRunComplete);
  const onRunFailedRef = useRef(opts.onRunFailed);
  const onTitleCreatedRef = useRef(opts.onTitleCreated);
  onRunCompleteRef.current = opts.onRunComplete;
  onRunFailedRef.current = opts.onRunFailed;
  onTitleCreatedRef.current = opts.onTitleCreated;

  useEffect(() => {
    if (!conversationId) {
      cleanup();
      return;
    }

    let isCancelled = false;
    const queryInput = { conversationId, limit: 50 };

    /**
     * Append or update a message in the React Query cache.
     * If a message with the given id exists, replace it. Otherwise append.
     */
    const upsertMessage = (msg: MessageFrontEnd) => {
      apiUtils.chat.getMessages.setData(queryInput, (prev) => {
        if (!prev) {
          return { messages: [msg], nextCursor: undefined };
        }

        const existingIdx = prev.messages.findIndex((m) => m.id === msg.id);
        if (existingIdx >= 0) {
          // Update existing message in place
          const updated = [...prev.messages];
          updated[existingIdx] = msg;
          return { ...prev, messages: updated };
        }

        // Append new message
        return { ...prev, messages: [...prev.messages, msg] };
      });
    };

    const connect = async () => {
      const { createEventSource } = await import("eventsource-client");

      if (isCancelled) return;

      cleanup();

      const channel = `conversation.${conversationId}`;
      const url = `${SERVER_URL}/stream?channel=${channel}`;

      const es = createEventSource({
        url,
        onMessage: ({ event, data }) => {
          if (isCancelled) return;

          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;

            switch (event) {
              case "message.start": {
                const msgId = parsed.id as string;
                accumulatedMessageRef.current = "";
                currentMessageIdRef.current = msgId;

                // Optimistically insert empty assistant message
                upsertMessage({
                  id: msgId,
                  role: "assistant",
                  message: "",
                  userId: "",
                  toolCallId: null,
                  createdAt: new Date(),
                  toolCalls: null,
                  processing: true,
                });
                break;
              }

              case "message.delta": {
                const msgId = currentMessageIdRef.current;
                if (!msgId) break;

                accumulatedMessageRef.current += parsed.message as string;

                upsertMessage({
                  id: msgId,
                  role: "assistant",
                  message: accumulatedMessageRef.current,
                  userId: "",
                  toolCallId: null,
                  createdAt: new Date(),
                  toolCalls: null,
                  processing: true,
                });
                break;
              }

              case "thinking.start": {
                const msgId = currentMessageIdRef.current;
                if (!msgId) break;

                upsertMessage({
                  id: msgId,
                  role: "assistant",
                  message: accumulatedMessageRef.current,
                  userId: "",
                  toolCallId: null,
                  createdAt: new Date(),
                  toolCalls: null,
                  processing: true,
                });
                break;
              }

              case "tool.result": {
                const output = parsed.output as Record<string, unknown>;
                const toolCallName = output.tool_call_name as string;

                if (toolCallName === "show_widget" && output.attachments) {
                  try {
                    const attachments = JSON.parse(
                      output.attachments as string,
                    ) as Array<Record<string, unknown>>;

                    if (attachments.length > 0) {
                      const toolMsgId = output.message_id as string;
                      upsertMessage({
                        id: `tool-${toolMsgId}-${output.tool_call_id}`,
                        role: "tool",
                        message: null,
                        userId: "",
                        toolCallId: output.tool_call_id as string,
                        createdAt: new Date(),
                        toolCalls: null,
                        processing: false,
                        attachments,
                      });
                    }
                  } catch {
                    /* ignore parse errors */
                  }
                }
                break;
              }

              case "tool.description": {
                // Update explanation on the current assistant message
                const msgId = currentMessageIdRef.current;
                if (!msgId) break;

                upsertMessage({
                  id: msgId,
                  role: "assistant",
                  message: accumulatedMessageRef.current,
                  userId: "",
                  toolCallId: null,
                  createdAt: new Date(),
                  toolCalls: null,
                  processing: true,
                });
                break;
              }

              case "run.complete": {
                currentMessageIdRef.current = null;
                accumulatedMessageRef.current = "";

                // Refetch from DB to get the persisted version
                void apiUtils.chat.getMessages.invalidate(queryInput);
                void apiUtils.chat.status.invalidate({
                  conversationId,
                });
                void apiUtils.chat.getConversations.invalidate();
                onRunCompleteRef.current?.();
                break;
              }

              case "run.failed": {
                currentMessageIdRef.current = null;
                accumulatedMessageRef.current = "";

                void apiUtils.chat.getMessages.invalidate(queryInput);
                void apiUtils.chat.status.invalidate({
                  conversationId,
                });
                onRunFailedRef.current?.(parsed.error as string | undefined);
                break;
              }

              case "run.aborted": {
                currentMessageIdRef.current = null;
                accumulatedMessageRef.current = "";

                void apiUtils.chat.getMessages.invalidate(queryInput);
                void apiUtils.chat.status.invalidate({
                  conversationId,
                });
                break;
              }

              case "chat.title.created": {
                const title = parsed.title as string;
                onTitleCreatedRef.current?.(title);
                void apiUtils.chat.getConversations.invalidate();
                break;
              }
            }
          } catch {
            // Ignore parse errors for heartbeats etc.
          }
        },
      });

      eventSourceRef.current = es;
    };

    void connect();

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [conversationId, cleanup, apiUtils]);
}
