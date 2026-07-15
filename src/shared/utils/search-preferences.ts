const PREFERRED_CITY_KEY = "buscazap_preferred_city";

export function getPreferredCity(): string {
  if (typeof window === "undefined") return "";

  try {
    return localStorage.getItem(PREFERRED_CITY_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setPreferredCity(city: string): void {
  if (typeof window === "undefined") return;

  const value = city.trim();

  try {
    if (value) {
      localStorage.setItem(PREFERRED_CITY_KEY, value);
    } else {
      localStorage.removeItem(PREFERRED_CITY_KEY);
    }
  } catch {
    // Ignore storage failures (private mode, quota, etc).
  }
}

export function buildSearchHref(input: {
  readonly query?: string;
  readonly city?: string;
  readonly neighborhood?: string;
  readonly category?: string;
  readonly type?: string;
}): string {
  const params = new URLSearchParams();

  if (input.query?.trim()) params.set("q", input.query.trim());
  if (input.city?.trim()) params.set("city", input.city.trim());
  if (input.neighborhood?.trim()) {
    params.set("neighborhood", input.neighborhood.trim());
  }
  if (input.category?.trim()) params.set("category", input.category.trim());
  if (input.type && input.type !== "all") params.set("type", input.type);

  const queryString = params.toString();
  return queryString ? `/buscar?${queryString}` : "/buscar";
}
