"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitySelectProps {
  readonly cities: readonly string[];
  readonly value: string;
  readonly onChange: (city: string) => void;
  readonly className?: string;
  readonly id?: string;
}

export function CitySelect({
  cities,
  value,
  onChange,
  className,
  id = "city-select",
}: CitySelectProps) {
  const options =
    value && !cities.includes(value) ? [value, ...cities] : cities;

  return (
    <div className={cn("relative", className)}>
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Cidade"
        className="flex h-10 w-full appearance-none rounded-md border border-input bg-background py-2 pl-10 pr-9 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        <option value="">Cidade</option>
        {options.map((cityName) => (
          <option key={cityName} value={cityName}>
            {cityName}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
