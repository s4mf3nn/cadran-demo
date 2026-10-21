import * as React from "react"
import { cn } from "cn"

/** Touche de clavier : 11 px, bordure --input, bordure basse de 2 px, rayon de 4 px. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-b-2 border-input bg-background px-1 font-sans text-[11px] leading-none font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
