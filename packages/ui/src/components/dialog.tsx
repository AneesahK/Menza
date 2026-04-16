"use client";

import type * as React from "react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { mergeProps, useRender } from "@base-ui/react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { PiMultipleCrossCancelDefaultStroke } from "@demo/icons/pika/stroke/maths";

function DialogRoot({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 bg-black/40 opacity-100 backdrop-blur-[5px] transition-all duration-150 ease-in-out-quint dark:bg-black/70",
        "data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none",
        "data-[ending-style]:opacity-0 data-[ending-style]:backdrop-blur-none",
        "[mask:linear-gradient(to_top,black_20%,transparent_125%)]",
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  children,
  backdrop,
  keepMounted,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup> & {
  backdrop?: React.ComponentProps<typeof DialogPrimitive.Backdrop>;
  keepMounted?: boolean;
}) {
  return (
    <DialogPortal keepMounted={keepMounted}>
      <DialogBackdrop {...backdrop} />
      <DialogPrimitive.Popup
        data-slot="dialog-popup"
        className={cn(
          "overflow-hidden rounded-2xl bg-secondary ring ring-border",
          "fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 p-1",
          "transition-[scale,opacity] duration-150",
          "data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
          "data-[ending-style]:scale-90 data-[ending-style]:opacity-0",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

interface DialogBodyProps extends useRender.ComponentProps<"div"> {}

function DialogBody({ className, ...props }: DialogBodyProps) {
  const { render = <div />, ...otherProps } = props;

  const defaultProps = {
    "data-slot": "dialog-body",
    className: cn(
      "rounded-t-[12px] bg-background p-3",
      "last:rounded-b-[12px]",
      className,
    ),
  };

  const element = useRender({
    render,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return element;
}

function DialogHeader({
  className,
  showCloseButton = true,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2 rounded-t-[12px] bg-secondary p-3 text-center sm:text-left",
        className,
      )}
      {...props}
    >
      {showCloseButton && (
        <DialogClose
          className={cn(
            "absolute top-2 right-2 text-xs [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "ring-offset-secondary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden",
          )}
          render={
            <Button
              variant="secondary"
              size="icon"
              className="opacity-50 transition-opacity duration-150 hover:opacity-100 focus:opacity-100 focus-visible:opacity-100"
            />
          }
        >
          <PiMultipleCrossCancelDefaultStroke />
          <span className="sr-only">Close</span>
        </DialogClose>
      )}
      {children}
    </div>
  );
}

interface DialogFooterProps extends useRender.ComponentProps<"div"> {}

function DialogFooter({ className, ...props }: DialogFooterProps) {
  const { render = <div />, ...otherProps } = props;

  const defaultProps = {
    "data-slot": "dialog-footer",
    className: cn("rounded-b-[12px] bg-background p-3", className),
  };

  const element = useRender({
    render,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return element;
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-base leading-none font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm font-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Popup: DialogPopup,
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};
