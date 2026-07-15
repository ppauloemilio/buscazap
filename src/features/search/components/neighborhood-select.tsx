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
}

export function NeighborhoodSelect({
  neighborhoods,
  value,
  onChange,
  disabled = false,
  className,
  id = "neighborhood-select",
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
        className="flex h-10 w-full appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-9 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        <option value="">
          {disabled
            ? "Escolha a cidade"
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
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
