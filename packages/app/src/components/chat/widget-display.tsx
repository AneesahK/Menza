"use client";

import { api } from "@/trpc/react";
import { PiSpinnerStroke } from "@demo/icons/pika/stroke/general";

interface WidgetDisplayProps {
  widgetId: string;
}

export function WidgetDisplay({ widgetId }: WidgetDisplayProps) {
  const { data: widget, isLoading } = api.widget.getById.useQuery({
    id: widgetId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8">
        <PiSpinnerStroke className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Widget not found</p>
      </div>
    );
  }

  const widgetType = widget.config?.type;
  const widgetTitle =
    widget.config && "title" in widget.config
      ? (widget.config.title as string)
      : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium capitalize">{widgetType ?? "Widget"}</span>
        {widgetTitle && (
          <>
            <span>·</span>
            <span>{widgetTitle}</span>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Widget rendering will be implemented with AG Charts / AG Grid.
      </p>
    </div>
  );
}
