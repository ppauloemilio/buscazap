"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchPlanFilter } from "@/shared/utils/search-preferences";

interface PlanSelectProps {
  readonly value: SearchPlanFilter | "";
  readonly onChange: (plan: SearchPlanFilter | "") => void;
  readonly className?: string;
  readonly id?: string;
  readonly compact?: boolean;
}

const OPTIONS: ReadonlyArray<{
  readonly value: SearchPlanFilter | "";
  readonly label: string;
}> = [
  { value: "", label: "Plano" },
  { value: "free", label: "Plano Grátis" },
  { value: "basic", label: "Plano Básico" },
  { value: "pro", label: "Plano Pro" },
  { value: "paid", label: "Todos pagos" },
];

export function PlanSelect({
  value,
  onChange,
  className,
  id = "plan-select",
  compact = false,
}: PlanSelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(
            next === "free" ||
              next === "basic" ||
              next === "pro" ||
              next === "paid"
              ? next
              : ""
          );
        }}
        aria-label="Filtrar por plano"
        className={cn(
          "flex w-full appearance-none rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          compact
            ? "h-8 py-1 pl-2 pr-7 text-xs"
            : "h-10 py-2 pl-3 pr-9 text-base md:text-sm"
        )}
      >
        {OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          compact ? "right-2 h-3 w-3" : "right-3 h-4 w-4"
        )}
      />
    </div>
  );
}
