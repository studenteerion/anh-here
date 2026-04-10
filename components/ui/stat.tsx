"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Stat({ title, value, className }: { title: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-muted/50 rounded-lg p-3 sm:p-4 border', className)}>
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="text-lg sm:text-xl font-bold">{value}</div>
    </div>
  );
}

export default Stat;
