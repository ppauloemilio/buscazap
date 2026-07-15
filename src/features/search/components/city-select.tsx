"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitySelectProps {
  readonly cities: readonly string[];
  readonly value: string;
  readonly onChange: (city: string) => void;
  readonly className?: string;
  readonly id?: string;
  readonly compact?: boolean;
}

export function CitySelect({
  cities,
  value,
  onChange,
  className,
  id = "city-select",
  compact = false,
}: CitySelectProps) {
  const options =
    value && !cities.includes(value) ? [value, ...cities] : cities;

  return (
    <div className={cn("relative", className)}>
      <MapPin
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          compact ? "left-2 h-3 w-3" : "left-3 h-4 w-4"
        )}
      />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Cidade"
        className={cn(
          "flex w-full appearance-none rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          compact
            ? "h-8 py-1 pl-7 pr-7 text-xs"
            : "h-10 py-2 pl-10 pr-9 text-base md:text-sm"
        )}
      >
        <option value="">Cidade</option>
        {options.map((cityName) => (
          <option key={cityName} value={cityName}>
            {cityName}
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
