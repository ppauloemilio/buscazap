"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { CatalogLocationOption } from "@/shared/utils/catalog-location";

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
  const initialState =
    defaultState.trim().toUpperCase() ||
    (cities.find((city) => city.name === defaultCity)?.state ??
      states[0]?.uf ??
      "");

  const [selectedState, setSelectedState] = useState(initialState);
  const [city, setCity] = useState(defaultCity);

  const citiesForState = useMemo(() => {
    if (!selectedState) return cities;
    return cities.filter((item) => item.state === selectedState);
  }, [cities, selectedState]);

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
        <Input
          id={cityId}
          name={cityName}
          list={`${cityId}-options`}
          required={required}
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Digite ou escolha a cidade"
        />
        <datalist id={`${cityId}-options`}>
          {citiesForState.map((item) => (
            <option key={`${item.state}-${item.name}`} value={item.name} />
          ))}
        </datalist>
      </div>
      <div>
        <label htmlFor={stateId} className={labelClass}>
          UF
        </label>
        <select
          id={stateId}
          name={stateName}
          className={selectClass}
          required={required}
          value={selectedState}
          onChange={(event) => {
            const nextState = event.target.value;
            setSelectedState(nextState);
            const stillValid = cities.some(
              (item) =>
                item.state === nextState &&
                item.name.toLowerCase() === city.trim().toLowerCase()
            );
            if (!stillValid) setCity("");
          }}
        >
          {states.length === 0 ? (
            <option value="">Nenhum estado ativo</option>
          ) : (
            states.map((state) => (
              <option key={state.uf} value={state.uf}>
                {state.uf}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}
