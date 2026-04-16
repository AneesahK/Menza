"use client";

import { useCallback, useRef, useState } from "react";

import { PiStopCircleSolid } from "@demo/icons/pika/solid/media";
import { PiSendPlaneSlantStroke } from "@demo/icons/pika/stroke/communication";
import { Button } from "@demo/ui/components/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isProcessing: boolean;
}

export function ChatInput({ onSend, onStop, isProcessing }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isProcessing, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask a question about your data..."
        rows={1}
        className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      {isProcessing ? (
        <Button
          variant="secondary"
          size="icon"
          className="size-8 shrink-0"
          onClick={onStop}
        >
          <PiStopCircleSolid className="size-4" />
        </Button>
      ) : (
        <Button
          variant="default"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          <PiSendPlaneSlantStroke className="size-4" />
        </Button>
      )}
    </div>
  );
}
