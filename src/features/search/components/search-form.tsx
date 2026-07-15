"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category/category-icon";
import type { SearchCategoryOption } from "@/features/dashboard/components/hero-search";
import { CitySelect } from "@/features/search/components/city-select";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";
import {
  buildSearchHref,
  getPreferredCity,
  setPreferredCity,
} from "@/shared/utils/search-preferences";

interface SearchFormProps {
  readonly initialQuery?: string;
  readonly initialCity?: string;
  readonly initialCategory?: string;
  readonly initialPremium?: boolean;
  readonly initialSort?: string;
  readonly cities?: readonly string[];
  readonly categories?: readonly SearchCategoryOption[];
}

export function SearchForm({
  initialQuery = "",
  initialCity = "",
  initialCategory,
  initialPremium,
  initialSort,
  cities = POPULAR_CITIES,
  categories = [],
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory || "all");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory || "all");
  }, [initialQuery, initialCategory]);

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
    readonly category?: string;
  }) {
    const resolvedQuery = next?.query ?? query;
    const resolvedCity = next?.city ?? city;
    const resolvedCategory = next?.category ?? category;

    setPreferredCity(resolvedCity);

    const href = buildSearchHref({
      query: resolvedQuery,
      city: resolvedCity,
      category: resolvedCategory === "all" ? undefined : resolvedCategory,
    });

    const params = new URLSearchParams(href.includes("?") ? href.split("?")[1] : "");
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="O que você procura?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            aria-label="Termo de busca"
          />
        </div>
        <div className="relative sm:w-52">
          <CitySelect
            cities={cities}
            value={city}
            onChange={(nextCity) => {
              setCity(nextCity);
              setPreferredCity(nextCity);
            }}
            id="search-city"
            className="sm:w-52"
          />
        </div>
        <Button type="submit" variant="whatsapp" className="sm:w-auto">
          <Search className="h-4 w-4" />
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
                <CategoryIcon icon={item.icon} size="sm" className="text-[11px]" />
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
