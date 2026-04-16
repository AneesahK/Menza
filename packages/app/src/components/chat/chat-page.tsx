"use client";

import { useCallback, useState } from "react";

import { useChatSSE } from "@/hooks/use-chat-sse";
import { api } from "@/trpc/react";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { useRouter, useSearchParams } from "next/navigation";

export function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: messagesData, refetch: refetchMessages } =
    api.chat.getMessages.useQuery(
      { conversationId: conversationId ?? "", limit: 50 },
      { enabled: !!conversationId },
    );

  const { data: statusData } = api.chat.status.useQuery(
    { conversationId: conversationId ?? "" },
    { enabled: !!conversationId },
  );

  const createConversation = api.chat.createConversation.useMutation();
  const sendMessage = api.chat.sendMessage.useMutation();
  const stopGeneration = api.chat.stopGeneration.useMutation();

  // SSE connection
  useChatSSE(conversationId, {
    onRunComplete: () => {
      setIsProcessing(false);
      void refetchMessages();
    },
    onRunFailed: () => {
      setIsProcessing(false);
      void refetchMessages();
    },
  });

  // Sync processing state
  const processing = isProcessing || statusData?.isProcessing === true;

  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsProcessing(true);

      try {
        if (!conversationId) {
          const result = await createConversation.mutateAsync({
            initialMessage: message,
          });
          router.push(`/?c=${result.conversationId}`);
        } else {
          await sendMessage.mutateAsync({
            conversationId,
            message,
          });
          void refetchMessages();
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        setIsProcessing(false);
      }
    },
    [conversationId, router, refetchMessages, createConversation, sendMessage],
  );

  const handleStop = useCallback(() => {
    if (!conversationId) return;
    setIsProcessing(false);
    void stopGeneration.mutateAsync({ conversationId });
  }, [conversationId, stopGeneration]);

  const messages = messagesData?.messages ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        {conversationId ? (
          <MessageList messages={messages} isProcessing={processing} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-medium">Welcome to Menza</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start a conversation by typing a message below
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStop}
            isProcessing={processing}
          />
        </div>
      </div>
    </div>
  );
}
