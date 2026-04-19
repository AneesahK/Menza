"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@demo/ui/components/button";
import { Input } from "@demo/ui/components/input";
import { Textarea } from "@demo/ui/components/textarea";
import { ScrollArea } from "@demo/ui/components/scroll-area";
import { Toast } from "@demo/ui/components/toast";
import { PiCheckTickSingleStroke } from "@demo/icons/pika/stroke/general";
import { PiMultipleCrossCancelDefaultStroke } from "@demo/icons/pika/stroke/maths";
import { PiPlusDefaultStroke } from "@demo/icons/pika/stroke/maths";

export default function MemoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const { data: memories, refetch } = api.memory.list.useQuery();
  const createMutation = api.memory.create.useMutation({
    onSuccess: () => {
      void refetch();
      setNewMemoryContent("");
      setToast({ message: "Memory added", variant: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to add memory", variant: "error" });
    },
  });
  const updateMutation = api.memory.update.useMutation({
    onSuccess: () => {
      void refetch();
      setEditingMemoryId(null);
      setEditingContent("");
      setToast({ message: "Memory updated", variant: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to update memory", variant: "error" });
    },
  });
  const deleteMutation = api.memory.delete.useMutation({
    onSuccess: () => {
      void refetch();
      setToast({ message: "Memory deleted", variant: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to delete memory", variant: "error" });
    },
  });

  const filteredMemories = memories?.filter((memory) =>
    memory.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddMemory = () => {
    if (createMutation.isPending) {
      return;
    }

    if (newMemoryContent.trim()) {
      createMutation.mutate({ content: newMemoryContent.trim() });
    }
  };

  const startEditingMemory = (id: string, content: string) => {
    setEditingMemoryId(id);
    setEditingContent(content);
  };

  const cancelEditingMemory = () => {
    setEditingMemoryId(null);
    setEditingContent("");
  };

  const handleEditMemory = () => {
    if (updateMutation.isPending) {
      return;
    }

    if (editingMemoryId && editingContent.trim()) {
      updateMutation.mutate({
        id: editingMemoryId,
        content: editingContent.trim(),
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Saved Memories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your preferences and context that Menza remembers across
          conversations.
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Memories List */}
      <ScrollArea className="flex-1 rounded-lg border border-border">
        <div className="space-y-3 p-4">
          {!filteredMemories || filteredMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No memories match your search"
                  : "No saved memories yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {!searchQuery &&
                  "Menza will automatically remember your preferences as you chat"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex-1">
                    {editingMemoryId === memory.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEditingMemory();
                              return;
                            }

                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleEditMemory();
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-8 focus-visible:ring-[3px] focus-visible:ring-ring"
                            onClick={handleEditMemory}
                            disabled={
                              !editingContent.trim() || updateMutation.isPending
                            }
                          >
                            <PiCheckTickSingleStroke className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 focus-visible:ring-[3px] focus-visible:ring-ring"
                            onClick={cancelEditingMemory}
                            disabled={updateMutation.isPending}
                          >
                            <PiMultipleCrossCancelDefaultStroke className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className="text-sm"
                          onDoubleClick={() =>
                            startEditingMemory(memory.id, memory.content)
                          }
                        >
                          {memory.content}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {memory.metadata?.source === "manual"
                              ? "Manually added"
                              : "Automatically detected"}
                          </span>
                          {memory.metadata?.confidence !== undefined && (
                            <span>
                              Confidence: {(memory.metadata.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                          <span>
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {editingMemoryId !== memory.id && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingMemory(memory.id, memory.content)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => deleteMutation.mutate({ id: memory.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <PiMultipleCrossCancelDefaultStroke className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Add a new memory..."
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddMemory();
                  }
                }}
              />
              <Button
                variant="default"
                size="sm"
                className="gap-2 self-end"
                onClick={handleAddMemory}
                disabled={!newMemoryContent.trim() || createMutation.isPending}
              >
                <PiPlusDefaultStroke className="size-4" />
                {createMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
