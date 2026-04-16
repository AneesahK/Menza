import { tv, type VariantProps } from "tailwind-variants";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

export const buttonVariants = tv({
  base: "group relative inline-flex items-center justify-center overflow-hidden rounded-lg text-sm font-medium whitespace-nowrap outline-accent transition-colors ease-out-cubic focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      default:
        "bg-accent text-accent-foreground hover:bg-[oklch(from_var(--accent)_calc(l-0.075)_c_h)] disabled:bg-secondary disabled:text-muted-foreground aria-disabled:bg-secondary aria-disabled:text-muted-foreground",
      secondary:
        "bg-secondary text-foreground hover:bg-[oklch(from_var(--secondary)_calc(l-0.075)_c_h)] disabled:bg-secondary disabled:text-muted-foreground aria-disabled:bg-secondary aria-disabled:text-muted-foreground",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-[oklch(from_var(--destructive)_calc(l-0.075)_c_h)] disabled:bg-secondary disabled:text-muted-foreground aria-disabled:bg-secondary aria-disabled:text-muted-foreground",
      outline:
        "border border-border bg-background text-foreground hover:bg-secondary disabled:bg-secondary disabled:text-muted-foreground aria-disabled:bg-secondary aria-disabled:text-muted-foreground",
      ghost:
        "bg-none text-foreground hover:bg-secondary disabled:text-muted-foreground aria-disabled:text-muted-foreground",
      link: "cursor-pointer text-accent underline-offset-4 hover:underline hover:decoration-accent disabled:opacity-50 aria-disabled:opacity-50",
    },
    size: {
      default: "gap-2 px-2 py-1.5",
      sm: "gap-1.5 px-1.5 py-1",
      lg: "gap-3 px-3 py-2",
      icon: "size-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends
    useRender.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  render = <button />,
  children,
  ...props
}: ButtonProps) {
  const buttonClassName = buttonVariants({ variant, size, class: className });

  const defaultProps = {
    className: buttonClassName,
    "data-slot": "button",
    children,
  };

  const element = useRender({
    render,
    props: mergeProps<"button">(defaultProps, props),
  });

  return element;
}
