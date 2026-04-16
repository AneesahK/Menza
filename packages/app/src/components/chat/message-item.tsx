import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { MessageFrontEnd } from "@demo/db/schema";

interface MessageItemProps {
  message: MessageFrontEnd;
}

export function MessageItem({ message }: MessageItemProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-accent px-4 py-2 text-sm text-accent-foreground">
          {message.message}
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    return (
      <div className="space-y-3">
        <div className="prose prose-sm max-w-none text-foreground">
          <Markdown remarkPlugins={[remarkGfm]}>
            {stripSuggestionTags(message.message ?? "")}
          </Markdown>
        </div>
        <Suggestions text={message.message ?? ""} />
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment, i) => (
              <WidgetPlaceholder
                key={`${String(attachment.type)}-${String(i)}`}
                config={attachment}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tool result messages with attachments (widgets)
  if (
    message.role === "tool" &&
    message.attachments &&
    message.attachments.length > 0
  ) {
    return (
      <div className="space-y-2">
        {message.attachments.map((attachment, i) => (
          <WidgetPlaceholder
            key={`${String(attachment.type)}-${String(i)}`}
            config={attachment}
          />
        ))}
      </div>
    );
  }

  return null;
}

function WidgetPlaceholder({ config }: { config: Record<string, unknown> }) {
  const type = config.type as string | undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium capitalize">{type ?? "Widget"}</span>
        {config.title != null && (
          <>
            <span>·</span>
            <span>{String(config.title)}</span>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Widget rendering will be implemented with AG Charts / AG Grid.
      </p>
    </div>
  );
}

const SUGGESTION_REGEX = /<suggestion>([\s\S]*?)<\/suggestion>/g;

function stripSuggestionTags(text: string): string {
  return text.replace(SUGGESTION_REGEX, "").trim();
}

function Suggestions({ text }: { text: string }) {
  const matches = Array.from(text.matchAll(SUGGESTION_REGEX));
  const suggestions = matches
    .map((m) => m[1]?.trim())
    .filter((s): s is string => !!s);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
