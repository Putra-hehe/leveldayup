import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-white/10 placeholder:text-muted-foreground flex field-sizing-content min-h-20 w-full rounded-[24px] border bg-black/20 px-4 py-3 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[color,box-shadow,border-color,background] outline-none focus-visible:border-violet-400/35 focus-visible:ring-violet-400/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
