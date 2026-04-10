"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium', className)}>
      {children}
    </span>
  );
}

export default Badge;
