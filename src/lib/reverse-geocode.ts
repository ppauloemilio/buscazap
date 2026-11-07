export type ReverseGeocodeResult = {
  readonly city: string | null;
  readonly neighborhood: string | null;
  readonly state: string | null;
  readonly displayName: string | null;
};

type NominatimAddress = {
  readonly suburb?: string;
  readonly neighbourhood?: string;
  readonly neighborhood?: string;
  readonly city_district?: string;
  readonly borough?: string;
  readonly quarter?: string;
  readonly city?: string;
  readonly town?: string;
  readonly village?: string;
  readonly municipality?: string;
  readonly county?: string;
  readonly state?: string;
  readonly state_district?: string;
};

type NominatimResponse = {
  readonly display_name?: string;
  readonly address?: NominatimAddress;
  readonly error?: string;
};

function firstNonEmpty(
  ...values: Array<string | undefined | null>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function parseNominatimAddress(
  address: NominatimAddress | undefined,
  displayName?: string
): ReverseGeocodeResult {
  const neighborhood = firstNonEmpty(
    address?.suburb,
    address?.neighbourhood,
    address?.neighborhood,
    address?.city_district,
    address?.borough,
    address?.quarter
  );

  const city = firstNonEmpty(
    address?.city,
    address?.town,
    address?.village,
    address?.municipality,
    address?.county
  );

  return {
    city,
    neighborhood,
    state: firstNonEmpty(address?.state, address?.state_district),
    displayName: displayName?.trim() || null,
  };
}

/**
 * Reverse geocode via OpenStreetMap Nominatim (servidor).
 * Respeita a política de uso: User-Agent identificável + 1 req por chamada.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR,pt");
  url.searchParams.set("zoom", "16");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "BuscaZapp/1.0 (https://www.buscazapp.com.br; geolocation)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("Não foi possível obter a localização.");
  }

  const data = (await response.json()) as NominatimResponse;

  if (data.error) {
    throw new Error("Localização não encontrada.");
  }

  return parseNominatimAddress(data.address, data.display_name);
}
