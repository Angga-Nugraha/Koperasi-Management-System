/**
 * @file src/components/ui/skeleton.tsx
 * @description Komponen UI dasar (reusable): skeleton.
 */

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

export { Skeleton }
