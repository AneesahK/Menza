"use client";

import type * as React from "react";

import { cn } from "../lib/cn";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

function TooltipProvider({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;
}

function TooltipRoot({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip-root" {...props} />;
}

function TooltipTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      className={cn("", className)}
      {...props}
    />
  );
}

type TooltipContentProps = {
  positioner?: React.ComponentProps<typeof TooltipPrimitive.Positioner>;
  popup?: React.ComponentProps<typeof TooltipPrimitive.Popup>;
  arrow?: React.ComponentProps<typeof TooltipPrimitive.Arrow>;
  children: React.ReactNode;
};

function TooltipContent({
  positioner = {},
  popup = {},
  arrow = {},
  children,
}: TooltipContentProps) {
  const {
    sideOffset = 10,
    className: positionerClassName,
    ...positionerProps
  } = positioner;
  const { className: popupClassName, ...popupProps } = popup;
  const { className: arrowClassName, ...arrowProps } = arrow;

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        data-slot="tooltip-positioner"
        sideOffset={sideOffset}
        className={cn("", positionerClassName)}
        {...positionerProps}
      >
        <TooltipPrimitive.Popup
          className={cn(
            // "outline outline-red-500/20",
            // "ring ring-inset ring-white/20",
            "bg-neutral-800 text-xs text-neutral-100 dark:bg-neutral-100 dark:text-neutral-800",
            // "shadow-lg shadow-black/15 dark:shadow-white/20",
            "flex origin-[var(--transform-origin)] flex-col rounded-md px-2 py-1 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
            "ease-out-cubic data-[ending-style]:duration-100 data-[ending-style]:ease-in-cubic",
            popupClassName,
          )}
          {...popupProps}
        >
          <TooltipPrimitive.Arrow
            className={cn(
              "bg-neutral-800 text-xs text-neutral-100 dark:bg-neutral-100 dark:text-neutral-800",
              // "shadow-lg shadow-black/15 dark:shadow-white/20",
              "z-50 size-2.5 rounded-[2px]",
              "rotate-45 data-[side=bottom]:top-[-4px] data-[side=left]:right-[-4px] data-[side=right]:left-[-4px] data-[side=top]:bottom-[-4px]",
              arrowClassName,
            )}
            {...arrowProps}
          />
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export const Tooltip = {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
