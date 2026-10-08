"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CitySelect } from "@/features/search/components/city-select";
import { NeighborhoodSelect } from "@/features/search/components/neighborhood-select";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";
import {
  buildSearchHref,
  getPreferredCity,
  setPreferredCity,
  type SearchPlanFilter,
} from "@/shared/utils/search-preferences";

interface SearchFormProps {
  readonly initialQuery?: string;
  readonly initialCity?: string;
  readonly initialNeighborhood?: string;
  readonly initialCategory?: string;
  readonly initialPremium?: boolean;
  readonly initialPlan?: SearchPlanFilter;
  readonly initialSort?: string;
  readonly cities?: readonly string[];
  readonly neighborhoods?: readonly string[];
}

export function SearchForm({
  initialQuery = "",
  initialCity = "",
  initialNeighborhood = "",
  initialCategory,
  initialPremium,
  initialPlan,
  initialSort,
  cities = POPULAR_CITIES,
  neighborhoods = [],
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setNeighborhood(initialNeighborhood);
  }, [initialNeighborhood]);

  useEffect(() => {
    if (initialCity) {
      setCity(initialCity);
      setPreferredCity(initialCity);
      return;
    }

    if (initialCategory) {
      setCity("");
      setNeighborhood("");
      return;
    }

    const preferredCity = getPreferredCity();
    if (preferredCity) setCity(preferredCity);
  }, [initialCity, initialCategory]);

  function navigate(next?: {
    readonly query?: string;
    readonly city?: string;
    readonly neighborhood?: string;
  }) {
    const resolvedQuery = next?.query ?? query;
    const resolvedCity = next?.city ?? city;
    const resolvedNeighborhood = next?.neighborhood ?? neighborhood;

    setPreferredCity(resolvedCity);

    const href = buildSearchHref({
      query: resolvedQuery,
      city: resolvedCity,
      neighborhood: resolvedCity ? resolvedNeighborhood : undefined,
      category: initialCategory,
      premium: initialPremium,
      plan: initialPlan,
      sort: initialSort,
    });

    router.push(href);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate();
  }

  return (
    <form
      onSubmit={handleSearch}
      className="rounded-xl border bg-card p-4 shadow-sm md:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="O que você procura?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8 text-xs md:text-sm"
            aria-label="Termo de busca"
          />
        </div>
        <CitySelect
          cities={cities}
          value={city}
          compact
          onChange={(nextCity) => {
            setCity(nextCity);
            setNeighborhood("");
            setPreferredCity(nextCity);
            navigate({ city: nextCity, neighborhood: "" });
          }}
          id="search-city"
          className="sm:w-28"
        />
        <NeighborhoodSelect
          neighborhoods={neighborhoods}
          value={neighborhood}
          compact
          disabled={!city}
          onChange={(nextNeighborhood) => {
            setNeighborhood(nextNeighborhood);
            navigate({ neighborhood: nextNeighborhood });
          }}
          id="search-neighborhood"
          className="sm:w-28"
        />
        <Button
          type="submit"
          variant="whatsapp"
          size="sm"
          className="h-8 shrink-0 px-3 text-xs sm:px-4"
        >
          <Search className="h-3.5 w-3.5" />
          Buscar
        </Button>
      </div>
    </form>
  );
}
