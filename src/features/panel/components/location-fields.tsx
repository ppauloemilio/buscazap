"use client";

import { useMemo, useState } from "react";
import type { CatalogLocationOption } from "@/shared/utils/catalog-location";

const CITY_VALUE_SEP = "|||";

function encodeCityValue(city: CatalogLocationOption): string {
  return `${city.name}${CITY_VALUE_SEP}${city.state}`;
}

function decodeCityValue(value: string): CatalogLocationOption | null {
  const separatorIndex = value.indexOf(CITY_VALUE_SEP);
  if (separatorIndex <= 0) return null;
  const name = value.slice(0, separatorIndex);
  const state = value.slice(separatorIndex + CITY_VALUE_SEP.length);
  if (!name || !state) return null;
  return { name, state };
}

interface LocationFieldsProps {
  readonly states: readonly { readonly uf: string; readonly name: string }[];
  readonly cities: readonly CatalogLocationOption[];
  readonly defaultCity?: string;
  readonly defaultState?: string;
  readonly cityName?: string;
  readonly stateName?: string;
  readonly cityId?: string;
  readonly stateId?: string;
  readonly compact?: boolean;
  readonly required?: boolean;
}

export function LocationFields({
  states,
  cities,
  defaultCity = "",
  defaultState = "",
  cityName = "city",
  stateName = "state",
  cityId = "city",
  stateId = "state",
  compact = false,
  required = true,
}: LocationFieldsProps) {
  const initialEncoded =
    defaultCity.trim() && defaultState.trim()
      ? encodeCityValue({
          name: defaultCity.trim(),
          state: defaultState.trim().toUpperCase(),
        })
      : "";

  const [selectedValue, setSelectedValue] = useState(initialEncoded);

  const selected = useMemo(
    () => (selectedValue ? decodeCityValue(selectedValue) : null),
    [selectedValue]
  );

  const sortedCities = useMemo(
    () =>
      [...cities].sort((a, b) => {
        const byName = a.name.localeCompare(b.name, "pt-BR");
        if (byName !== 0) return byName;
        return a.state.localeCompare(b.state, "pt-BR");
      }),
    [cities]
  );

  const labelClass = compact
    ? "mb-1 block text-xs font-medium"
    : "mb-1 block text-sm font-medium";
  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <label htmlFor={cityId} className={labelClass}>
          Cidade
        </label>
        <select
          id={cityId}
          className={selectClass}
          required={required}
          value={selectedValue}
          onChange={(event) => setSelectedValue(event.target.value)}
        >
          <option value="">Selecione a cidade</option>
          {sortedCities.map((item) => (
            <option
              key={`${item.state}-${item.name}`}
              value={encodeCityValue(item)}
            >
              {item.name} ({item.state})
            </option>
          ))}
        </select>
        <input type="hidden" name={cityName} value={selected?.name ?? ""} />
        <input type="hidden" name={stateName} value={selected?.state ?? ""} />
      </div>
      <div>
        <label htmlFor={stateId} className={labelClass}>
          UF
        </label>
        <select
          id={stateId}
          className={selectClass}
          disabled
          value={selected?.state ?? ""}
          aria-label="UF preenchida pela cidade"
        >
          <option value="">—</option>
          {states.map((state) => (
            <option key={state.uf} value={state.uf}>
              {state.uf}
            </option>
          ))}
          {selected?.state &&
            !states.some((state) => state.uf === selected.state) && (
              <option value={selected.state}>{selected.state}</option>
            )}
        </select>
      </div>
    </div>
  );
}
