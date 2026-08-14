export type CatalogLocationOption = {
  readonly name: string;
  readonly state: string;
};

/** Preferência de default: Belém/PA se ativo; senão primeira cidade do catálogo. */
export function getDefaultCatalogLocation(
  cities: readonly CatalogLocationOption[],
  states: readonly { readonly uf: string }[]
): { readonly city: string; readonly state: string } {
  const belem = cities.find(
    (city) =>
      city.name.localeCompare("Belém", "pt-BR", { sensitivity: "base" }) === 0 &&
      city.state === "PA"
  );
  if (belem) {
    return { city: belem.name, state: belem.state };
  }

  const firstCity = cities[0];
  if (firstCity) {
    return { city: firstCity.name, state: firstCity.state };
  }

  return { city: "", state: states[0]?.uf ?? "" };
}
