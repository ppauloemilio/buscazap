import { ServiceArea } from "@/domain/enums";

export const SERVICE_AREA_OPTIONS = [
  {
    value: ServiceArea.NEIGHBORHOOD_ONLY,
    label: "Só no bairro",
    description: "Atende apenas no bairro informado",
  },
  {
    value: ServiceArea.NEARBY,
    label: "Bairros próximos",
    description: "Atende no bairro e arredores",
  },
  {
    value: ServiceArea.CITY_WIDE,
    label: "Toda a cidade / Delivery",
    description: "Atende em qualquer bairro ou faz delivery na cidade",
  },
  {
    value: ServiceArea.ON_SITE,
    label: "No local",
    description: "O cliente vai até o estabelecimento",
  },
  {
    value: ServiceArea.ON_REQUEST,
    label: "Sob consulta",
    description: "Confirme no WhatsApp se atende na sua região",
  },
] as const;

export function getServiceAreaLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return SERVICE_AREA_OPTIONS.find((option) => option.value === value)?.label;
}

export function formatAdvertisementLocation(input: {
  readonly city: string;
  readonly state?: string;
  readonly neighborhood?: string;
}): string {
  const place = input.neighborhood
    ? `${input.neighborhood}, ${input.city}`
    : input.city;

  return input.state ? `${place} - ${input.state}` : place;
}
