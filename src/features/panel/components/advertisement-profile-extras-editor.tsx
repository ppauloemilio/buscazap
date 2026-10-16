"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { updateAdvertisementProfileExtrasAction } from "@/actions/provider-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWeekdayLabels } from "@/shared/utils/business-hours";

interface AdvertisementProfileExtrasEditorProps {
  readonly advertisementId: string;
  readonly streetAddress?: string | null;
  readonly instagram?: string | null;
  readonly website?: string | null;
  readonly businessHoursJson?: string | null;
  readonly returnTo?: string;
}

function parseHoursDefaults(raw: string | null | undefined): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (let i = 0; i < 7; i += 1) defaults[String(i)] = "";
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw) as Record<string, string | null>;
    for (let i = 0; i < 7; i += 1) {
      defaults[String(i)] = parsed[String(i)] ?? "";
    }
  } catch {
    // ignore
  }
  return defaults;
}

export function AdvertisementProfileExtrasEditor({
  advertisementId,
  streetAddress,
  instagram,
  website,
  businessHoursJson,
  returnTo = "/painel/perfil",
}: AdvertisementProfileExtrasEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hourDefaults = parseHoursDefaults(businessHoursJson);
  const dayLabels = getWeekdayLabels();

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Endereço, horários, Instagram e site exibidos no perfil público do
        anúncio.
      </p>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form
        className="space-y-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            try {
              await updateAdvertisementProfileExtrasAction(
                new FormData(event.currentTarget)
              );
            } catch (err) {
              if (isRedirectError(err)) throw err;
              setError(err instanceof Error ? err.message : "Erro ao salvar");
            }
          });
        }}
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="streetAddress">
            Endereço completo
          </label>
          <Input
            id="streetAddress"
            name="streetAddress"
            defaultValue={streetAddress ?? ""}
            placeholder="Rua, número"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="instagram">
              Instagram
            </label>
            <Input
              id="instagram"
              name="instagram"
              defaultValue={instagram ?? ""}
              placeholder="@suaempresa"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="website">
              Site
            </label>
            <Input
              id="website"
              name="website"
              defaultValue={website ?? ""}
              placeholder="suaempresa.com.br"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">Horário de funcionamento</p>
          <div className="space-y-1.5">
            {dayLabels.map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-xs text-muted-foreground">
                  {label}
                </span>
                <Input
                  name={`hours_${index}`}
                  defaultValue={hourDefaults[String(index)] ?? ""}
                  placeholder="08:00-18:00 ou vazio"
                  className="h-8"
                />
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" size="sm" variant="whatsapp" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar perfil completo"}
        </Button>
      </form>
    </div>
  );
}
