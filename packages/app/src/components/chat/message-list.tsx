import { MessageItem } from "./message-item";
import type { MessageFrontEnd } from "@demo/db/schema";
import { PiSpinnerStroke } from "@demo/icons/pika/stroke/general";

interface MessageListProps {
  messages: Array<MessageFrontEnd>;
  isProcessing: boolean;
}

export function MessageList({ messages, isProcessing }: MessageListProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {isProcessing && messages.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PiSpinnerStroke className="size-4 animate-spin" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}
