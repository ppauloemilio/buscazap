"use client";

import { useMemo, useState } from "react";
import {
  bulkSetCitiesActiveAction,
  deleteCityAction,
  updateCityAction,
} from "@/actions/admin-catalog-actions";
import { AdminDeleteButton } from "@/features/admin/components/admin-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminCityItem {
  readonly id: string;
  readonly name: string;
  readonly stateId: string;
  readonly stateUf: string;
  readonly isActive: boolean;
  readonly usageCount: number;
}

interface AdminCityStateOption {
  readonly id: string;
  readonly uf: string;
  readonly name: string;
}

interface AdminCitiesBulkListProps {
  readonly cities: readonly AdminCityItem[];
  readonly states: readonly AdminCityStateOption[];
  readonly filterStateId?: string;
}

export function AdminCitiesBulkList({
  cities,
  states,
  filterStateId,
}: AdminCitiesBulkListProps) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const allIds = useMemo(() => cities.map((city) => city.id), [cities]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const selectedIds = [...selected];

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(allIds) : new Set());
  }

  if (cities.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma cidade encontrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-2.5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          <span>
            {selected.size > 0
              ? `${selected.size} cidade(s) selecionada(s)`
              : "Selecionar cidades"}
          </span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          <form action={bulkSetCitiesActiveAction}>
            <input type="hidden" name="isActive" value="true" />
            {filterStateId ? (
              <input type="hidden" name="stateId" value={filterStateId} />
            ) : null}
            {selectedIds.map((id) => (
              <input key={`on-${id}`} type="hidden" name="ids" value={id} />
            ))}
            <Button
              type="submit"
              size="sm"
              variant="whatsapp"
              disabled={selected.size === 0}
            >
              Ativar selecionadas
            </Button>
          </form>
          <form action={bulkSetCitiesActiveAction}>
            <input type="hidden" name="isActive" value="false" />
            {filterStateId ? (
              <input type="hidden" name="stateId" value={filterStateId} />
            ) : null}
            {selectedIds.map((id) => (
              <input key={`off-${id}`} type="hidden" name="ids" value={id} />
            ))}
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={selected.size === 0}
            >
              Desativar selecionadas
            </Button>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        {cities.map((city) => (
          <Card key={city.id}>
            <CardContent className="space-y-3 p-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-2.5 h-4 w-4 shrink-0 rounded border-input"
                  checked={selected.has(city.id)}
                  onChange={(event) => toggleOne(city.id, event.target.checked)}
                  aria-label={`Selecionar ${city.name}`}
                />
                <form
                  action={updateCityAction}
                  className="grid flex-1 gap-2 lg:grid-cols-4"
                >
                  <input type="hidden" name="id" value={city.id} />
                  <Input name="name" defaultValue={city.name} required />
                  <select
                    name="stateId"
                    defaultValue={city.stateId}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.uf} — {state.name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="isActive"
                    defaultValue={city.isActive ? "true" : "false"}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                  <Button type="submit" variant="outline" size="sm">
                    Salvar
                  </Button>
                </form>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pl-6">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={city.isActive ? "whatsapp" : "secondary"}>
                    {city.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                  <span>
                    {city.name}/{city.stateUf}
                  </span>
                  <span>{city.usageCount} anúncio(s)</span>
                </div>
                <AdminDeleteButton
                  action={deleteCityAction}
                  id={city.id}
                  label="Excluir"
                  confirmMessage={`Excluir a cidade ${city.name}/${city.stateUf}?`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
