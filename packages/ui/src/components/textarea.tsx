import { cn } from "../lib/cn";

type TextareaProps = React.ComponentProps<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full min-w-0 rounded-lg border border-border bg-input p-2 text-sm text-foreground transition-[color,box-shadow] ease-out-cubic outline-none",
        "focus-within:border-accent-ring focus-within:ring-[3px] focus-within:ring-ring",
        "selection:bg-primary selection:text-primary-foreground placeholder:text-sm placeholder:text-secondary-foreground md:text-sm",
        "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed",
        "aria-invalid:border-destructive-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}
