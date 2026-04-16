"use client";

import type * as React from "react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { PiMultipleCrossCancelDefaultStroke } from "@demo/icons/pika/stroke/maths";

function SheetRoot({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogPrimitive.Root
      data-slot="sheet"
      // modal="trap-focus"
      {...props}
    />
  );
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        "fixed inset-0 bg-black/40 opacity-100 backdrop-blur-[5px] dark:bg-black/70",
        "transition-all duration-300 ease-out-circ data-[ending-style]:duration-200 data-[ending-style]:ease-in-circ",
        "data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none",
        "data-[ending-style]:opacity-0 data-[ending-style]:backdrop-blur-none",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  backdropClassName,
  withBackdrop = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup> & {
  side?: "top" | "right" | "bottom" | "left";
  backdropClassName?: string;
  withBackdrop?: boolean;
}) {
  return (
    <SheetPortal>
      {withBackdrop && <SheetBackdrop className={backdropClassName} />}
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-secondary p-1 ring ring-border",
          "transition-all duration-500 ease-out-circ data-[ending-style]:duration-200 data-[ending-style]:ease-in-circ",
          // Side-specific positioning and animations
          side === "right" && [
            "inset-y-4 right-4 max-w-md rounded-2xl",
            "data-[starting-style]:translate-x-full",
            "data-[ending-style]:translate-x-full",
          ],
          side === "left" && [
            "inset-y-4 left-4 max-w-md rounded-2xl",
            "data-[starting-style]:-translate-x-full",
            "data-[ending-style]:-translate-x-full",
          ],
          side === "top" && [
            "inset-x-0 top-0 h-auto max-h-[75vh] rounded-b-2xl",
            "data-[starting-style]:-translate-y-full",
            "data-[ending-style]:-translate-y-full",
          ],
          side === "bottom" && [
            "inset-x-0 bottom-0 h-auto max-h-[75vh] rounded-t-2xl",
            "data-[starting-style]:translate-y-full",
            "data-[ending-style]:translate-y-full",
          ],
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  showCloseButton = true,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-2 bg-secondary p-3 text-left",
        className,
      )}
      {...props}
    >
      {showCloseButton && (
        <SheetClose
          className={cn(
            "absolute top-2 right-2 text-xs [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "ring-offset-secondary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden",
          )}
          render={
            <Button
              variant="ghost"
              size="icon"
              className="opacity-50 transition-opacity duration-150 hover:opacity-100 focus:opacity-100 focus-visible:opacity-100"
            />
          }
        >
          <PiMultipleCrossCancelDefaultStroke />
          <span className="sr-only">Close</span>
        </SheetClose>
      )}
      {children}
    </div>
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn(
        "flex-1 overflow-auto bg-background p-3",
        "rounded-t-[12px] last:rounded-b-[12px]",
        className,
      )}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto rounded-b-[12px] bg-background p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-base leading-none font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm font-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

export const Sheet = {
  Root: SheetRoot,
  Trigger: SheetTrigger,
  Content: SheetContent,
  Header: SheetHeader,
  Body: SheetBody,
  Footer: SheetFooter,
  Title: SheetTitle,
  Description: SheetDescription,
  Close: SheetClose,
};
