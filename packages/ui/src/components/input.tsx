import type * as React from "react";

import { cn } from "../lib/cn";
import { Input as InputPrimitive } from "@base-ui/react/input";

type InputProps = React.ComponentProps<typeof InputPrimitive> & {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

function Input({ className, leftSlot, rightSlot, ...props }: InputProps) {
  if (leftSlot || rightSlot) {
    return (
      <div
        className={cn(
          "flex h-8 w-full min-w-0 items-center rounded-lg border border-border bg-input text-foreground transition-[color,box-shadow] ease-out-cubic outline-none",
          "focus-within:border-accent-ring focus-within:ring-[3px] focus-within:ring-ring",
          "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60 has-[input[aria-disabled='true']]:cursor-not-allowed has-[input[aria-disabled='true']]:opacity-60",
          "has-[input[aria-invalid='true']]:border-destructive-ring has-[input[aria-invalid='true']]:ring-destructive/20 dark:has-[input[aria-invalid='true']]:ring-destructive/40",
          "[&_svg]:size-4", // [&_svg]:fill-foreground [&_svg]:stroke-foreground
          className,
        )}
      >
        {leftSlot && (
          <div className="shrink-0 pl-2 text-base text-secondary-foreground select-none md:text-sm">
            {leftSlot}
          </div>
        )}
        <InputPrimitive
          data-slot="input"
          className={cn(
            "flex h-full w-full min-w-0 bg-transparent py-1.5 text-base text-foreground outline-none",
            "selection:bg-primary selection:text-primary-foreground placeholder:text-sm placeholder:text-secondary-foreground md:text-sm",
            "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed",
            "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            leftSlot ? "pl-1.5" : "pl-2",
            rightSlot ? "pr-1.5" : "pr-2",
          )}
          {...props}
        />
        {rightSlot && (
          <div className="shrink-0 pr-2 text-base text-secondary-foreground select-none md:text-sm">
            {rightSlot}
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      data-slot="input"
      className={cn(
        "flex h-8 w-full min-w-0 rounded-lg border border-border bg-input px-2 py-1.5 text-base text-foreground transition-[color,box-shadow] ease-out-cubic outline-none",
        "selection:bg-primary selection:text-primary-foreground placeholder:text-sm placeholder:text-secondary-foreground md:text-sm",
        "focus-visible:border-accent-ring focus-visible:ring-[3px] focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
        "aria-invalid:border-destructive-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
