import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium tracking-[0.01em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border border-violet-400/20 bg-[linear-gradient(135deg,rgba(139,92,246,0.96),rgba(34,211,238,0.92))] text-white shadow-[0_18px_50px_rgba(76,29,149,0.35)] hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(6,182,212,0.16)]",
        destructive:
          "border border-destructive/40 bg-destructive/90 text-white hover:bg-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-white/10 bg-white/[0.04] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-violet-400/25 hover:bg-white/[0.07]",
        secondary:
          "border border-white/10 bg-secondary/85 text-secondary-foreground hover:bg-secondary",
        ghost:
          "text-foreground hover:bg-white/[0.05] hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-2xl px-6 text-base has-[>svg]:px-5",
        icon: "size-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
