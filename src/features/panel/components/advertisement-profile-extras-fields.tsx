import { Input } from "@/components/ui/input";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { getWeekdayLabels } from "@/shared/utils/business-hours";

interface AdvertisementProfileExtrasFieldsProps {
  readonly defaultStreetAddress?: string | null;
  readonly defaultInstagram?: string | null;
  readonly defaultWebsite?: string | null;
  readonly defaultBusinessHoursJson?: string | null;
  readonly showHeading?: boolean;
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

export function AdvertisementProfileExtrasFields({
  defaultStreetAddress,
  defaultInstagram,
  defaultWebsite,
  defaultBusinessHoursJson,
  showHeading = true,
}: AdvertisementProfileExtrasFieldsProps) {
  const hourDefaults = parseHoursDefaults(defaultBusinessHoursJson);
  const dayLabels = getWeekdayLabels();

  return (
    <div className="space-y-2.5 border-t pt-4">
      {showHeading ? (
        <div>
          <h3 className="text-base font-semibold">
            Perfil completo — endereço, horários e contatos
          </h3>
          <p className="text-xs text-muted-foreground">
            Endereço, horários, Instagram e site (plano{" "}
            {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}). Produtos e serviços
            você adiciona na etapa seguinte, após publicar.
          </p>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="streetAddress">
          Endereço completo
        </label>
        <Input
          id="streetAddress"
          name="streetAddress"
          defaultValue={defaultStreetAddress ?? ""}
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
            defaultValue={defaultInstagram ?? ""}
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
            defaultValue={defaultWebsite ?? ""}
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
    </div>
  );
}
