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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function AdminBulkFreeListingImport() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [okCount, setOkCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [created, setCreated] = useState<CreatedRow[] | null>(null);
  const [failed, setFailed] = useState<
    readonly { readonly line: number; readonly error: string }[] | null
  >(null);

  const selectableLines = useMemo(
    () =>
      (preview ?? [])
        .filter((row) => row.ok && row.whatsappNormalized)
        .map((row) => row.line),
    [preview]
  );

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

  function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setCreated(null);
    setFailed(null);
    setSelectedLines(new Set());

    startTransition(async () => {
      const result = await adminPreviewBulkFreeListingsAction(formData);
      if (!result.ok) {
        setPreview(null);
        setError(result.error);
        return;
      }
      setPreview(result.rows);
      setOkCount(result.okCount);
      setErrorCount(result.errorCount);
      setSelectedLines(
        new Set(
          result.rows
            .filter((row) => row.ok && row.whatsappNormalized)
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
          row.ok &&
          row.whatsappNormalized &&
          selectedLines.has(row.line)
      )
      .map((row) => ({
        line: row.line,
        nome: row.nome,
        categoria: row.categoriaResolvida || row.categoria,
        bairro: row.bairro,
        whatsapp: row.whatsappNormalized!,
      }));

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
            conferir o WhatsApp.
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
                {okCount} ok · {errorCount} com erro · {selectedCount}{" "}
                selecionado(s)
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
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
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
                  <th className="py-2 pr-2">Bairro</th>
                  <th className="py-2 pr-2">WhatsApp</th>
                  <th className="py-2">Teste</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => {
                  const canSelect = row.ok && Boolean(row.whatsappNormalized);
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
                        <Badge variant={row.ok ? "secondary" : "destructive"}>
                          {row.ok ? "Ok" : "Erro"}
                        </Badge>
                        {row.errors.length > 0 ? (
                          <ul className="mt-1 max-w-[180px] space-y-0.5 text-xs text-destructive">
                            {row.errors.map((item) => (
                              <li key={item}>· {item}</li>
                            ))}
                          </ul>
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
                      <td className="py-2 pr-2">{row.bairro || "—"}</td>
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
