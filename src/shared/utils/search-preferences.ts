const PREFERRED_CITY_KEY = "buscazapp_preferred_city";
const RETURN_PATH_KEY = "buscazapp_return_path";

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
  readonly premium?: boolean;
  readonly sort?: string;
}): string {
  const params = new URLSearchParams();

  if (input.query?.trim()) params.set("q", input.query.trim());
  if (input.city?.trim()) params.set("city", input.city.trim());
  if (input.neighborhood?.trim()) {
    params.set("neighborhood", input.neighborhood.trim());
  }
  if (input.category?.trim()) params.set("category", input.category.trim());
  if (input.type && input.type !== "all") params.set("type", input.type);
  if (input.premium) params.set("premium", "true");
  if (input.sort?.trim()) params.set("sort", input.sort.trim());

  const queryString = params.toString();
  return queryString ? `/buscar?${queryString}` : "/buscar";
}

export function isSafeInternalReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

export function resolveReturnPath(
  path: string | undefined,
  fallback = "/buscar"
): string {
  if (path && isSafeInternalReturnPath(path)) {
    return path;
  }

  return fallback;
}

/** Guarda de onde o usuário veio (botão Voltar), sem poluir a URL pública. */
export function rememberReturnPath(path: string | undefined): void {
  if (typeof window === "undefined") return;
  if (!path || !isSafeInternalReturnPath(path)) return;

  try {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  } catch {
    // Ignore storage failures (private mode, quota, etc).
  }
}

export function consumeReturnPath(fallback = "/buscar"): string {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = sessionStorage.getItem(RETURN_PATH_KEY)?.trim();
    if (stored && isSafeInternalReturnPath(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage failures.
  }

  return fallback;
}

/** URL canônica do anúncio — sem query params (SEO). */
export function buildAdvertisementHref(input: {
  readonly publicHref?: string | null;
  readonly id: string;
  /** @deprecated Mantido por compatibilidade; não entra mais na URL. */
  readonly returnTo?: string;
}): string {
  return input.publicHref ?? `/anuncio/${input.id}`;
}
