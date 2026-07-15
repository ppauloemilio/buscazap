"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeighborhoodSelectProps {
  readonly neighborhoods: readonly string[];
  readonly value: string;
  readonly onChange: (neighborhood: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
  readonly compact?: boolean;
}

export function NeighborhoodSelect({
  neighborhoods,
  value,
  onChange,
  disabled = false,
  className,
  id = "neighborhood-select",
  compact = false,
}: NeighborhoodSelectProps) {
  const options =
    value && !neighborhoods.includes(value)
      ? [value, ...neighborhoods]
      : neighborhoods;

  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        value={value}
        disabled={disabled || options.length === 0}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Bairro"
        className={cn(
          "flex w-full appearance-none rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          compact
            ? "h-8 py-1 pl-2 pr-7 text-xs"
            : "h-10 py-2 pl-3 pr-9 text-base md:text-sm"
        )}
      >
        <option value="">
          {disabled
            ? "Cidade"
            : options.length === 0
              ? "Sem bairros"
              : "Bairro"}
        </option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
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
