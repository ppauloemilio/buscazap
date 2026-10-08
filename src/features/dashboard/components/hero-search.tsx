"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CitySelect } from "@/features/search/components/city-select";
import { NeighborhoodSelect } from "@/features/search/components/neighborhood-select";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";
import { neighborhoodsForCity } from "@/shared/utils/neighborhoods";
import {
  buildSearchHref,
  getPreferredCity,
  setPreferredCity,
} from "@/shared/utils/search-preferences";

export interface SearchCategoryOption {
  readonly name: string;
  readonly slug: string;
  readonly icon: string;
}

export interface CityNeighborhoodGroup {
  readonly city: string;
  readonly neighborhoods: readonly string[];
}

interface HeroSearchProps {
  readonly cities?: readonly string[];
  readonly neighborhoodsByCity?: readonly CityNeighborhoodGroup[];
}

export function HeroSearch({
  cities = POPULAR_CITIES,
  neighborhoodsByCity = [],
}: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  useEffect(() => {
    const preferredCity = getPreferredCity();
    if (preferredCity) setCity(preferredCity);
  }, []);

  const neighborhoods = neighborhoodsForCity(neighborhoodsByCity, city);

  function goToSearch(input?: {
    readonly query?: string;
    readonly city?: string;
    readonly neighborhood?: string;
  }) {
    const resolvedQuery = input?.query ?? query;
    const resolvedCity = input?.city ?? city;
    const resolvedNeighborhood = input?.neighborhood ?? neighborhood;

    setPreferredCity(resolvedCity);
    router.push(
      buildSearchHref({
        query: resolvedQuery,
        city: resolvedCity,
        neighborhood: resolvedCity ? resolvedNeighborhood : undefined,
      })
    );
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    goToSearch();
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-whatsapp/10 via-background to-primary/5 px-4 pb-3 pt-4 md:pb-4 md:pt-6">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:mb-3 md:text-5xl">
          Encontre o <span className="text-whatsapp">Whatsapp</span> do que você precisa
        </h1>
        <p className="mb-4 text-base text-muted-foreground md:mb-5 md:text-lg">
          Busque na sua cidade e fale direto no WhatsApp.
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto max-w-3xl rounded-2xl border bg-card p-4 shadow-lg md:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ex.: gás, água, delivery, dentista..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-8 text-xs md:text-sm"
                aria-label="Termo de busca"
                autoFocus
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
              }}
              id="hero-city"
              className="sm:w-28"
            />
            <NeighborhoodSelect
              neighborhoods={neighborhoods}
              value={neighborhood}
              compact
              disabled={!city}
              onChange={setNeighborhood}
              id="hero-neighborhood"
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
      </div>
    </section>
  );
}
