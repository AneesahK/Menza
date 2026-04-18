"use client";

import { useState, useEffect } from "react";

import { api } from "@/trpc/react";
import { PiSpinnerStroke } from "@demo/icons/pika/stroke/general";
import { Textarea } from "@demo/ui/components/textarea";

export default function SettingsPage() {
  const [instructions, setInstructions] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const { data, isLoading } = api.user.getInstructions.useQuery();
  const updateInstructions = api.user.updateInstructions.useMutation();

  // Sync query data to local state
  useEffect(() => {
    if (data) {
      setInstructions(data.instructions);
    }
  }, [data]);

  const handleBlur = async () => {
    if (instructions === data?.instructions) {
      return; // No changes
    }

    try {
      const result = await updateInstructions.mutateAsync({ instructions });
      setConfirmation(result.confirmation);
    } catch (error) {
      console.error("Failed to save instructions:", error);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">Assistant Instructions</h1>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PiSpinnerStroke className="size-4 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onBlur={handleBlur}
              placeholder="Tell the assistant about your business. e.g. All revenue is in GBP. 'Active customers' means customers who have placed an order with no refund in the last 90 days."
              rows={8}
              disabled={updateInstructions.isPending}
            />

            {confirmation && (
              <p className="text-sm text-muted-foreground">{confirmation}</p>
            )}

            {updateInstructions.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PiSpinnerStroke className="size-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
