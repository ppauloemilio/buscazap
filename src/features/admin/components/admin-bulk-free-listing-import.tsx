"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, MessageCircle, Upload } from "lucide-react";
import {
  adminConfirmBulkFreeListingsAction,
  adminPreviewBulkFreeListingsAction,
} from "@/actions/admin-actions";
import {
  BULK_FREE_LISTING_CSV_TEMPLATE,
  BULK_FREE_LISTING_MAX_ROWS,
} from "@/lib/bulk-free-listing-csv";
import type { CatalogLocationOption } from "@/shared/utils/catalog-location";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EMPTY_BAIRRO_ERROR = "Bairro vazio — selecione a cidade";
const EMPTY_BAIRRO_ERROR_LEGACY = "Bairro vazio";

type PreviewRow = {
  readonly line: number;
  readonly nome: string;
  readonly categoria: string;
  readonly categoriaResolvida: string;
  readonly bairro: string;
  readonly whatsappRaw: string;
  readonly whatsappNormalized: string | null;
  readonly whatsappDisplay: string;
  readonly waMeHref: string | null;
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};

type CreatedRow = {
  readonly line: number;
  readonly nome: string;
  readonly whatsapp: string;
  readonly advertisementId: string;
  readonly publicHref: string;
  readonly claimUrl: string;
  readonly notifyHref: string;
};

type CityChoice = {
  readonly city: string;
  readonly state: string;
};

function cityKey(city: CatalogLocationOption): string {
  return `${city.name}||${city.state}`;
}

function parseCityKey(value: string): CityChoice | null {
  const [city, state] = value.split("||");
  if (!city?.trim() || !state?.trim()) return null;
  return { city: city.trim(), state: state.trim().toUpperCase() };
}

function isEmptyBairroError(message: string): boolean {
  return (
    message === EMPTY_BAIRRO_ERROR || message === EMPTY_BAIRRO_ERROR_LEGACY
  );
}

function needsCityChoice(row: PreviewRow): boolean {
  return !row.bairro.trim();
}

function rowBlockingErrors(row: PreviewRow): readonly string[] {
  // Cidade na UI resolve o erro de bairro vazio (não duplicar no status).
  return row.errors.filter((error) => !isEmptyBairroError(error));
}

function isRowImportable(
  row: PreviewRow,
  cityByLine: ReadonlyMap<number, CityChoice>
): boolean {
  if (!row.whatsappNormalized) return false;
  if (needsCityChoice(row) && !cityByLine.get(row.line)) return false;
  return rowBlockingErrors(row).length === 0;
}

export function AdminBulkFreeListingImport({
  cities,
}: {
  readonly cities: readonly CatalogLocationOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [cityByLine, setCityByLine] = useState<Map<number, CityChoice>>(
    () => new Map()
  );
  const [bulkCityKey, setBulkCityKey] = useState("");
  const [created, setCreated] = useState<CreatedRow[] | null>(null);
  const [failed, setFailed] = useState<
    readonly { readonly line: number; readonly error: string }[] | null
  >(null);

  const emptyBairroLines = useMemo(
    () => (preview ?? []).filter(needsCityChoice).map((row) => row.line),
    [preview]
  );

  const selectableLines = useMemo(
    () =>
      (preview ?? [])
        .filter((row) => isRowImportable(row, cityByLine))
        .map((row) => row.line),
    [preview, cityByLine]
  );

  const statusCounts = useMemo(() => {
    const rows = preview ?? [];
    let ok = 0;
    let withError = 0;
    for (const row of rows) {
      if (isRowImportable(row, cityByLine)) ok += 1;
      else withError += 1;
    }
    return { ok, withError };
  }, [preview, cityByLine]);

  const selectedCount = useMemo(
    () => selectableLines.filter((line) => selectedLines.has(line)).length,
    [selectableLines, selectedLines]
  );

  const allSelectableChecked =
    selectableLines.length > 0 &&
    selectableLines.every((line) => selectedLines.has(line));

  function downloadTemplate() {
    const blob = new Blob([BULK_FREE_LISTING_CSV_TEMPLATE], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-anuncios-gratis.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reconcileSelection(
    nextCityByLine: Map<number, CityChoice>,
    autoSelectLines: readonly number[] = []
  ) {
    if (!preview) return;
    const autoSelect = new Set(autoSelectLines);
    setSelectedLines((prev) => {
      const next = new Set<number>();
      for (const row of preview) {
        if (!isRowImportable(row, nextCityByLine)) continue;
        if (prev.has(row.line) || autoSelect.has(row.line)) {
          next.add(row.line);
        }
      }
      return next;
    });
  }

  function setCityForLine(line: number, value: string) {
    const parsed = parseCityKey(value);
    const next = new Map(cityByLine);
    if (parsed) next.set(line, parsed);
    else next.delete(line);
    setCityByLine(next);
    reconcileSelection(next, parsed ? [line] : []);
  }

  function applyBulkCity() {
    const parsed = parseCityKey(bulkCityKey);
    if (!parsed || emptyBairroLines.length === 0) return;
    const next = new Map(cityByLine);
    for (const line of emptyBairroLines) {
      next.set(line, parsed);
    }
    setCityByLine(next);
    reconcileSelection(next, emptyBairroLines);
  }

  function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setCreated(null);
    setFailed(null);
    setSelectedLines(new Set());
    setCityByLine(new Map());
    setBulkCityKey("");

    startTransition(async () => {
      const result = await adminPreviewBulkFreeListingsAction(formData);
      if (!result.ok) {
        setPreview(null);
        setError(result.error);
        return;
      }
      setPreview(result.rows);
      setSelectedLines(
        new Set(
          result.rows
            .filter((row) => isRowImportable(row, new Map()))
            .map((row) => row.line)
        )
      );
    });
  }

  function toggleLine(line: number, checked: boolean) {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (checked) next.add(line);
      else next.delete(line);
      return next;
    });
  }

  function toggleAllSelectable(checked: boolean) {
    setSelectedLines(checked ? new Set(selectableLines) : new Set());
  }

  function handleConfirm() {
    if (!preview) return;
    const rows = preview
      .filter(
        (row) =>
          isRowImportable(row, cityByLine) && selectedLines.has(row.line)
      )
      .map((row) => {
        const cityChoice = cityByLine.get(row.line);
        return {
          line: row.line,
          nome: row.nome,
          categoria: row.categoriaResolvida || row.categoria,
          bairro: row.bairro,
          whatsapp: row.whatsappNormalized!,
          ...(needsCityChoice(row) && cityChoice
            ? { cidade: cityChoice.city, uf: cityChoice.state }
            : {}),
        };
      });

    if (rows.length === 0) {
      setError("Selecione ao menos uma linha válida para importar");
      return;
    }

    if (
      !window.confirm(
        `Criar ${rows.length} anúncio(s) Plano Grátis selecionado(s)?`
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await adminConfirmBulkFreeListingsAction({ rows });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated(result.created);
      setFailed(result.failed);
      setPreview(null);
      setSelectedLines(new Set());
      setCityByLine(new Map());
      setBulkCityKey("");
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Arquivo CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Colunas: <code>nome,categoria,bairro,whatsapp</code>. Aceita também
            separador <code>;</code>. Máximo {BULK_FREE_LISTING_MAX_ROWS} linhas.
            Marque só os que deseja criar e use &quot;Testar&quot; para
            conferir o WhatsApp. Sem bairro, escolha a cidade na pré-visualização.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5" />
              Baixar modelo CSV
            </Button>
          </div>
          <form onSubmit={handlePreview} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="bulk-csv" className="mb-1 block text-sm font-medium">
                Selecionar arquivo
              </label>
              <input
                id="bulk-csv"
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
              />
            </div>
            <Button type="submit" variant="whatsapp" disabled={isPending}>
              <Upload className="h-4 w-4" />
              {isPending ? "Analisando..." : "Pré-visualizar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {preview && preview.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base">Pré-visualização</CardTitle>
              <p className="text-xs text-muted-foreground">
                {statusCounts.ok} ok · {statusCounts.withError} com erro ·{" "}
                {selectedCount} selecionado(s)
              </p>
            </div>
            <Button
              type="button"
              variant="whatsapp"
              size="sm"
              disabled={isPending || selectedCount === 0}
              onClick={handleConfirm}
            >
              {isPending ? "Importando..." : "Importar Selecionados"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 overflow-x-auto">
            {emptyBairroLines.length > 0 ? (
              <div className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-3 text-sm dark:bg-amber-950/30">
                <p className="mb-2 font-medium text-amber-950 dark:text-amber-100">
                  {emptyBairroLines.length} linha(s) com bairro vazio — escolha
                  a cidade para cadastrar
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-[220px] flex-1">
                    <label
                      htmlFor="bulk-city-all"
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      Cidade para todas as linhas sem bairro
                    </label>
                    <select
                      id="bulk-city-all"
                      value={bulkCityKey}
                      onChange={(event) => setBulkCityKey(event.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="">Selecione a cidade</option>
                      {cities.map((city) => (
                        <option key={cityKey(city)} value={cityKey(city)}>
                          {city.name} ({city.state})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!bulkCityKey}
                    onClick={applyBulkCity}
                  >
                    Aplicar a todas sem bairro
                  </Button>
                </div>
              </div>
            ) : null}

            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-2">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos os válidos"
                      checked={allSelectableChecked}
                      disabled={selectableLines.length === 0}
                      onChange={(event) =>
                        toggleAllSelectable(event.target.checked)
                      }
                    />
                  </th>
                  <th className="py-2 pr-2">Linha</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Nome</th>
                  <th className="py-2 pr-2">Categoria</th>
                  <th className="py-2 pr-2">Bairro / Cidade</th>
                  <th className="py-2 pr-2">WhatsApp</th>
                  <th className="py-2">Teste</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => {
                  const cityChoice = cityByLine.get(row.line);
                  const canSelect = isRowImportable(row, cityByLine);
                  const displayErrors = rowBlockingErrors(row);
                  const rowOk = canSelect;
                  const emptyBairro = needsCityChoice(row);

                  return (
                    <tr
                      key={row.line}
                      className="border-b align-top last:border-0"
                    >
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar linha ${row.line}`}
                          disabled={!canSelect}
                          checked={canSelect && selectedLines.has(row.line)}
                          onChange={(event) =>
                            toggleLine(row.line, event.target.checked)
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 font-mono text-xs">{row.line}</td>
                      <td className="py-2 pr-2">
                        <Badge variant={rowOk ? "secondary" : "destructive"}>
                          {rowOk ? "Ok" : "Erro"}
                        </Badge>
                        {displayErrors.length > 0 ? (
                          <ul className="mt-1 max-w-[200px] space-y-0.5 text-xs text-destructive">
                            {displayErrors.map((item) => (
                              <li key={item}>· {item}</li>
                            ))}
                          </ul>
                        ) : null}
                        {emptyBairro && !cityChoice ? (
                          <p className="mt-1 max-w-[200px] text-xs text-amber-700">
                            · Selecione a cidade ao lado
                          </p>
                        ) : null}
                        {row.warnings.length > 0 ? (
                          <ul className="mt-1 max-w-[180px] space-y-0.5 text-xs text-amber-700">
                            {row.warnings.map((item) => (
                              <li key={item}>· {item}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="py-2 pr-2">{row.nome || "—"}</td>
                      <td className="py-2 pr-2">
                        {row.categoriaResolvida || row.categoria || "—"}
                      </td>
                      <td className="py-2 pr-2">
                        {emptyBairro ? (
                          <div className="min-w-[160px]">
                            <select
                              aria-label={`Cidade da linha ${row.line}`}
                              value={
                                cityChoice
                                  ? cityKey({
                                      name: cityChoice.city,
                                      state: cityChoice.state,
                                    })
                                  : ""
                              }
                              onChange={(event) =>
                                setCityForLine(row.line, event.target.value)
                              }
                              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                            >
                              <option value="">Cidade…</option>
                              {cities.map((city) => (
                                <option
                                  key={cityKey(city)}
                                  value={cityKey(city)}
                                >
                                  {city.name} ({city.state})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          row.bairro
                        )}
                      </td>
                      <td className="py-2 pr-2 font-mono text-xs">
                        {row.whatsappDisplay || "—"}
                      </td>
                      <td className="py-2">
                        {row.waMeHref ? (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={row.waMeHref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Testar
                            </a>
                          </Button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {created ? (
        <Card className="border-whatsapp/40 bg-whatsapp/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Importação concluída — {created.length} criado(s)
              {failed && failed.length > 0 ? ` · ${failed.length} falha(s)` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {failed && failed.length > 0 ? (
              <ul className="space-y-1 text-sm text-destructive">
                {failed.map((item) => (
                  <li key={`${item.line}-${item.error}`}>
                    Linha {item.line}: {item.error}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="space-y-2">
              {created.map((row) => (
                <div
                  key={row.advertisementId}
                  className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-medium">{row.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Linha {row.line} ·{" "}
                      <a
                        href={row.publicHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Ver anúncio
                      </a>
                    </p>
                  </div>
                  <Button variant="whatsapp" size="sm" asChild>
                    <a
                      href={row.notifyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Avisar no WhatsApp
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
