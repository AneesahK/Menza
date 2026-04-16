"use client";

import type * as React from "react";

import { cn } from "../lib/cn";
import { Menu } from "@base-ui/react/menu";
import { ScrollArea } from "@base-ui/react/scroll-area";
import { PiChevronRightStroke } from "@demo/icons/pika/stroke/arrows-chevrons";

function DropdownMenuRoot({
  ...props
}: React.ComponentProps<typeof Menu.Root>) {
  return <Menu.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn("data-popup-open:bg-secondary", className)}
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  children,
  positioner = {},
  ...props
}: React.ComponentProps<typeof Menu.Popup> & {
  positioner?: React.ComponentProps<typeof Menu.Positioner>;
}) {
  const {
    className: positionerClassName,
    sideOffset = 4,
    ...positionerProps
  } = positioner;
  return (
    <Menu.Portal data-slot="dropdown-menu-portal">
      <Menu.Positioner
        data-slot="dropdown-menu-positioner"
        sideOffset={sideOffset}
        className={cn("outline-none", positionerClassName)}
        {...positionerProps}
      >
        <Menu.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 min-w-32 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-lg transition-[opacity,scale] duration-200 ease-out-circ outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
          {...props}
        >
          <ScrollArea.Root className="size-full min-h-0">
            <ScrollArea.Viewport
              className="p-1"
              style={{ maxHeight: "var(--available-height)" }}
            >
              {children}
            </ScrollArea.Viewport>
            <MenuScrollbar orientation="vertical" />
          </ScrollArea.Root>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof Menu.Group>) {
  return <Menu.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Menu.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm/5 text-foreground outline-none select-none aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-highlighted:bg-secondary [&_svg:not([class*='text-'])]:text-muted-foreground",
        "data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive-muted data-[variant=destructive]:data-highlighted:text-destructive data-[variant=destructive]:*:[svg]:text-destructive!",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof Menu.CheckboxItem>) {
  return (
    <Menu.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "group relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm text-foreground outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-secondary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex items-center justify-center">
        <Menu.CheckboxItemIndicator
          keepMounted
          render={(props, state) => {
            return (
              <span
                {...props}
                className={cn(
                  "flex size-4 items-center justify-center rounded-sm bg-input",
                  "ring ring-border",
                  "data-checked:bg-accent data-checked:ring-0",
                )}
              >
                {state.checked && (
                  <svg
                    aria-hidden="true"
                    fill="currentcolor"
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    className="size-3 text-neutral-50"
                  >
                    <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
                  </svg>
                )}
              </span>
            );
          }}
        />
      </span>
      {children}
    </Menu.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof Menu.RadioGroup>) {
  return <Menu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm text-foreground outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-secondary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex items-center justify-center">
        <Menu.RadioItemIndicator
          keepMounted
          render={(props, state) => {
            return (
              <span
                {...props}
                className="flex size-3.5 items-center justify-center rounded-full border border-border bg-transparent"
              >
                {state.checked && (
                  <span className="relative size-2 rounded-full bg-accent"></span>
                )}
              </span>
            );
          }}
        ></Menu.RadioItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  );
}

function DropdownMenuGroupLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Menu.GroupLabel> & {
  inset?: boolean;
}) {
  return (
    <Menu.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-inset:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Menu.Separator>) {
  return (
    <Menu.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof Menu.SubmenuRoot>) {
  return <Menu.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof Menu.SubmenuTrigger> & {
  inset?: boolean;
}) {
  return (
    <Menu.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center rounded-lg px-2 py-1.5 text-sm/5 text-foreground outline-hidden select-none data-highlighted:bg-secondary data-inset:pl-8 data-popup-open:bg-secondary",
        className,
      )}
      {...props}
    >
      {children}
      <PiChevronRightStroke className="ml-auto size-4" />
    </Menu.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  sideOffset = 4,
  alignOffset = -4,
  children,
  ...props
}: React.ComponentProps<typeof Menu.Popup> & {
  sideOffset?: number;
  alignOffset?: number;
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner
        data-slot="dropdown-menu-sub-positioner"
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="outline-hidden"
      >
        <Menu.Popup
          data-slot="dropdown-menu-sub-content"
          className={cn(
            "z-50 min-w-32 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-lg transition-[opacity,scale] duration-200 ease-out-circ data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
          {...props}
        >
          <ScrollArea.Root className="size-full min-h-0">
            <ScrollArea.Viewport
              className="p-1"
              style={{ maxHeight: "var(--available-height)" }}
            >
              {children}
            </ScrollArea.Viewport>
            <MenuScrollbar orientation="vertical" />
          </ScrollArea.Root>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function MenuScrollbar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollArea.Scrollbar>) {
  return (
    <ScrollArea.Scrollbar
      className={cn(
        "m-1 flex opacity-0 transition-opacity delay-300 data-hovering:opacity-100 data-hovering:delay-0 data-hovering:duration-100 data-scrolling:opacity-100 data-scrolling:delay-0 data-scrolling:duration-100 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-1.5",
        className,
      )}
      data-slot="dropdown-menu-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollArea.Thumb
        className="relative flex-1 rounded-full bg-foreground/20"
        data-slot="dropdown-menu-scrollbar-thumb"
      />
    </ScrollArea.Scrollbar>
  );
}

export const DropdownMenu = {
  Root: DropdownMenuRoot,
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Group: DropdownMenuGroup,
  GroupLabel: DropdownMenuGroupLabel,
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Separator: DropdownMenuSeparator,
  Shortcut: DropdownMenuShortcut,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};
