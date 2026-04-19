"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@demo/ui/components/button";
import { Dialog } from "@demo/ui/components/dialog";
import { Input } from "@demo/ui/components/input";
import { Textarea } from "@demo/ui/components/textarea";
import { ScrollArea } from "@demo/ui/components/scroll-area";
import { PiMultipleCrossCancelDefaultStroke } from "@demo/icons/pika/stroke/maths";
import { PiPlusDefaultStroke } from "@demo/icons/pika/stroke/maths";

export default function MemoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [editingMemory, setEditingMemory] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);

  const { data: memories, refetch } = api.memory.list.useQuery();
  const createMutation = api.memory.create.useMutation({
    onSuccess: () => {
      void refetch();
      setIsAddDialogOpen(false);
      setNewMemoryContent("");
    },
  });
  const updateMutation = api.memory.update.useMutation({
    onSuccess: () => {
      void refetch();
      setIsEditDialogOpen(false);
      setEditingMemory(null);
    },
  });
  const deleteMutation = api.memory.delete.useMutation({
    onSuccess: () => {
      void refetch();
      setIsDeleteDialogOpen(false);
      setDeletingMemoryId(null);
    },
  });

  const filteredMemories = memories?.filter((memory) =>
    memory.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddMemory = () => {
    if (newMemoryContent.trim()) {
      createMutation.mutate({ content: newMemoryContent.trim() });
    }
  };

  const handleEditMemory = () => {
    if (editingMemory && editingMemory.content.trim()) {
      updateMutation.mutate({
        id: editingMemory.id,
        content: editingMemory.content.trim(),
      });
    }
  };

  const handleDeleteMemory = () => {
    if (deletingMemoryId) {
      deleteMutation.mutate({ id: deletingMemoryId });
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

      {/* Search and Add */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="default"
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2"
        >
          <PiPlusDefaultStroke className="size-4" />
          Add Memory
        </Button>
      </div>

      {/* Memories List */}
      <ScrollArea className="flex-1 rounded-lg border border-border">
        <div className="p-4">
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
                    <p className="text-sm">{memory.content}</p>
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
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMemory({
                          id: memory.id,
                          content: memory.content,
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setDeletingMemoryId(memory.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <PiMultipleCrossCancelDefaultStroke className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Memory Dialog */}
      <Dialog.Root
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <Dialog.Popup>
          <Dialog.Header>
            <Dialog.Title>Add New Memory</Dialog.Title>
            <Dialog.Description>
              Add a preference or context for Menza to remember.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <Textarea
              placeholder="E.g., 'Always show revenue in GBP' or 'Exclude test accounts from reports'"
              value={newMemoryContent}
              onChange={(e) => setNewMemoryContent(e.target.value)}
              rows={4}
            />
          </Dialog.Body>
          <Dialog.Footer className="flex justify-end gap-2">
            <Dialog.Close render={<Button variant="secondary" />}>
              Cancel
            </Dialog.Close>
            <Button
              variant="default"
              onClick={handleAddMemory}
              disabled={!newMemoryContent.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Adding..." : "Add Memory"}
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>

      {/* Edit Memory Dialog */}
      <Dialog.Root
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <Dialog.Popup>
          <Dialog.Header>
            <Dialog.Title>Edit Memory</Dialog.Title>
            <Dialog.Description>
              Update the content of this memory.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <Textarea
              value={editingMemory?.content ?? ""}
              onChange={(e) =>
                setEditingMemory(
                  editingMemory
                    ? { ...editingMemory, content: e.target.value }
                    : null,
                )
              }
              rows={4}
            />
          </Dialog.Body>
          <Dialog.Footer className="flex justify-end gap-2">
            <Dialog.Close render={<Button variant="secondary" />}>
              Cancel
            </Dialog.Close>
            <Button
              variant="default"
              onClick={handleEditMemory}
              disabled={
                !editingMemory?.content.trim() || updateMutation.isPending
              }
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <Dialog.Popup>
          <Dialog.Header>
            <Dialog.Title>Delete Memory</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete this memory? This action cannot be
              undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer className="flex justify-end gap-2">
            <Dialog.Close render={<Button variant="secondary" />}>
              Cancel
            </Dialog.Close>
            <Button
              variant="default"
              onClick={handleDeleteMemory}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}
