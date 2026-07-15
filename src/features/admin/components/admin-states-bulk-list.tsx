"use client";

import { useMemo, useState } from "react";
import {
  bulkSetStatesActiveAction,
  deleteStateAction,
  updateStateAction,
} from "@/actions/admin-catalog-actions";
import { AdminDeleteButton } from "@/features/admin/components/admin-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminStateItem {
  readonly id: string;
  readonly uf: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly citiesCount: number;
  readonly usageCount: number;
}

interface AdminStatesBulkListProps {
  readonly states: readonly AdminStateItem[];
}

export function AdminStatesBulkList({ states }: AdminStatesBulkListProps) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const allIds = useMemo(() => states.map((state) => state.id), [states]);
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
              ? `${selected.size} estado(s) selecionado(s)`
              : "Selecionar estados"}
          </span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          <form action={bulkSetStatesActiveAction}>
            <input type="hidden" name="isActive" value="true" />
            {selectedIds.map((id) => (
              <input key={`on-${id}`} type="hidden" name="ids" value={id} />
            ))}
            <Button
              type="submit"
              size="sm"
              variant="whatsapp"
              disabled={selected.size === 0}
            >
              Ativar selecionados
            </Button>
          </form>
          <form action={bulkSetStatesActiveAction}>
            <input type="hidden" name="isActive" value="false" />
            {selectedIds.map((id) => (
              <input key={`off-${id}`} type="hidden" name="ids" value={id} />
            ))}
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={selected.size === 0}
            >
              Desativar selecionados
            </Button>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        {states.map((state) => (
          <Card key={state.id}>
            <CardContent className="space-y-3 p-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-2.5 h-4 w-4 shrink-0 rounded border-input"
                  checked={selected.has(state.id)}
                  onChange={(event) => toggleOne(state.id, event.target.checked)}
                  aria-label={`Selecionar ${state.uf}`}
                />
                <form
                  action={updateStateAction}
                  className="grid flex-1 gap-2 lg:grid-cols-5"
                >
                  <input type="hidden" name="id" value={state.id} />
                  <Input name="uf" defaultValue={state.uf} maxLength={2} required />
                  <Input name="name" defaultValue={state.name} required />
                  <Input
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={state.sortOrder}
                  />
                  <select
                    name="isActive"
                    defaultValue={state.isActive ? "true" : "false"}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                  <Button type="submit" variant="outline" size="sm">
                    Salvar
                  </Button>
                </form>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pl-6">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={state.isActive ? "whatsapp" : "secondary"}>
                    {state.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <span>{state.citiesCount} cidade(s)</span>
                  <span>{state.usageCount} uso(s) em anúncios/usuários</span>
                </div>
                <AdminDeleteButton
                  action={deleteStateAction}
                  id={state.id}
                  label="Excluir"
                  confirmMessage={`Excluir o estado ${state.uf} — ${state.name}?`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
