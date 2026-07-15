"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category/category-icon";
import { CitySelect } from "@/features/search/components/city-select";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";
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

interface HeroSearchProps {
  readonly cities?: readonly string[];
  readonly categories?: readonly SearchCategoryOption[];
}

export function HeroSearch({
  cities = POPULAR_CITIES,
  categories = [],
}: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const preferredCity = getPreferredCity();
    if (preferredCity) setCity(preferredCity);
  }, []);

  function goToSearch(input?: {
    readonly query?: string;
    readonly city?: string;
    readonly category?: string;
  }) {
    const resolvedQuery = input?.query ?? query;
    const resolvedCity = input?.city ?? city;
    const resolvedCategory = input?.category ?? category;

    setPreferredCity(resolvedCity);
    router.push(
      buildSearchHref({
        query: resolvedQuery,
        city: resolvedCity,
        category: resolvedCategory === "all" ? undefined : resolvedCategory,
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
          Busque por categoria na sua cidade e fale direto no WhatsApp.
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto max-w-2xl space-y-2.5 rounded-2xl border bg-card p-4 shadow-lg md:p-5"
        >
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ex.: gás, água, delivery, dentista..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                aria-label="Termo de busca"
                autoFocus
              />
            </div>
            <div className="relative sm:w-48">
              <CitySelect
                cities={cities}
                value={city}
                onChange={(nextCity) => {
                  setCity(nextCity);
                  setPreferredCity(nextCity);
                }}
                id="hero-city"
                className="sm:w-48"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <SlidersHorizontal className="h-3 w-3" />
              {showFilters ? "Ocultar categorias" : "Categorias"}
            </button>

            <Button type="submit" variant="whatsapp" size="sm" className="h-9 px-4">
              <Search className="h-3.5 w-3.5" />
              Buscar
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-1 border-t pt-2">
              <button
                type="button"
                onClick={() => {
                  setCategory("all");
                  goToSearch({ category: "all" });
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
                    goToSearch({ category: item.slug });
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
        </form>
      </div>
    </section>
  );
}
