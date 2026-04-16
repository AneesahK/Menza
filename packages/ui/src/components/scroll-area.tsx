"use client";

import type { RefCallback } from "react";

import { cn } from "../lib/cn";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

export interface ScrollAreaProps extends ScrollAreaPrimitive.Root.Props {
  /** Masks viewport edges so content fades in/out as you scroll */
  scrollFade?: boolean;
  /** Reserves space for the scrollbar to prevent layout shifts */
  scrollbarGutter?: boolean;
  /** Ref callback for the viewport element (scroll container) */
  viewportRef?: RefCallback<HTMLDivElement>;
  /** Ref callback for the content element */
  contentRef?: RefCallback<HTMLDivElement>;
  /** Additional class name for the viewport element */
  viewportClassName?: string;
}

export function ScrollArea({
  className,
  children,
  scrollFade = false,
  scrollbarGutter = false,
  viewportRef,
  contentRef,
  viewportClassName,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      className={cn("size-full min-h-0", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={cn(
          "h-full rounded-[inherit] transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-has-overflow-x:overscroll-x-contain",
          scrollFade &&
            "mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))] mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))] mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))] mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))] [--fade-size:1.5rem]",
          scrollbarGutter &&
            "data-has-overflow-x:pb-2.5 data-has-overflow-y:pe-2.5",
          viewportClassName,
        )}
        data-slot="scroll-area-viewport"
      >
        {contentRef ? <div ref={contentRef}>{children}</div> : children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  );
}

export interface ScrollBarProps extends ScrollAreaPrimitive.Scrollbar.Props {}

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        "m-1 flex opacity-0 transition-opacity delay-300 data-hovering:opacity-100 data-hovering:delay-0 data-hovering:duration-100 data-scrolling:opacity-100 data-scrolling:delay-0 data-scrolling:duration-100 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-1.5",
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full bg-foreground/20"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
