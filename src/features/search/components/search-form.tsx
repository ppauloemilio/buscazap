"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category/category-icon";
import type { SearchCategoryOption } from "@/features/dashboard/components/hero-search";
import { CitySelect } from "@/features/search/components/city-select";
import { NeighborhoodSelect } from "@/features/search/components/neighborhood-select";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";
import {
  buildSearchHref,
  getPreferredCity,
  setPreferredCity,
} from "@/shared/utils/search-preferences";

interface SearchFormProps {
  readonly initialQuery?: string;
  readonly initialCity?: string;
  readonly initialNeighborhood?: string;
  readonly initialCategory?: string;
  readonly initialPremium?: boolean;
  readonly initialSort?: string;
  readonly cities?: readonly string[];
  readonly neighborhoods?: readonly string[];
  readonly categories?: readonly SearchCategoryOption[];
}

export function SearchForm({
  initialQuery = "",
  initialCity = "",
  initialNeighborhood = "",
  initialCategory,
  initialPremium,
  initialSort,
  cities = POPULAR_CITIES,
  neighborhoods = [],
  categories = [],
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);
  const [category, setCategory] = useState(initialCategory || "all");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory || "all");
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    setNeighborhood(initialNeighborhood);
  }, [initialNeighborhood]);

  useEffect(() => {
    if (initialCity) {
      setCity(initialCity);
      setPreferredCity(initialCity);
      return;
    }

    const preferredCity = getPreferredCity();
    if (preferredCity) setCity(preferredCity);
  }, [initialCity]);

  function navigate(next?: {
    readonly query?: string;
    readonly city?: string;
    readonly neighborhood?: string;
    readonly category?: string;
  }) {
    const resolvedQuery = next?.query ?? query;
    const resolvedCity = next?.city ?? city;
    const resolvedNeighborhood = next?.neighborhood ?? neighborhood;
    const resolvedCategory = next?.category ?? category;

    setPreferredCity(resolvedCity);

    const href = buildSearchHref({
      query: resolvedQuery,
      city: resolvedCity,
      neighborhood: resolvedCity ? resolvedNeighborhood : undefined,
      category: resolvedCategory === "all" ? undefined : resolvedCategory,
    });

    const params = new URLSearchParams(
      href.includes("?") ? href.split("?")[1] : ""
    );
    if (initialPremium) params.set("premium", "true");
    if (initialSort) params.set("sort", initialSort);

    const qs = params.toString();
    router.push(qs ? `/buscar?${qs}` : "/buscar");
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-64">
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
        <Button type="submit" variant="whatsapp" size="sm" className="h-8 px-3 text-xs sm:w-auto">
          <Search className="h-3.5 w-3.5" />
          Buscar
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showFilters ? "Ocultar categorias" : "Categorias"}
        </button>

        {showFilters && (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                navigate({ category: "all" });
              }}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                category === "all"
                  ? "bg-whatsapp text-whatsapp-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todas
            </button>
            {categories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => {
                  setCategory(item.slug);
                  navigate({ category: item.slug });
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  category === item.slug
                    ? "bg-whatsapp text-whatsapp-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <CategoryIcon
                  icon={item.icon}
                  size="sm"
                  className="text-[11px]"
                />
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
