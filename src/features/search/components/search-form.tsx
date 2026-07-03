"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";

const SEARCH_TYPES = [
  { value: "all", label: "Tudo" },
  { value: "PROFESSIONAL", label: "Profissionais" },
  { value: "COMPANY", label: "Empresas" },
  { value: "PRODUCT", label: "Produtos" },
  { value: "SERVICE", label: "Serviços" },
] as const;

interface SearchFormProps {
  readonly initialQuery?: string;
  readonly initialCity?: string;
  readonly initialType?: string;
  readonly initialCategory?: string;
  readonly initialPremium?: boolean;
  readonly initialSort?: string;
}

export function SearchForm({
  initialQuery = "",
  initialCity = "",
  initialType = "all",
  initialCategory,
  initialPremium,
  initialSort,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [searchType, setSearchType] = useState(initialType || "all");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());
    if (searchType !== "all") params.set("type", searchType);
    if (initialCategory) params.set("category", initialCategory);
    if (initialPremium) params.set("premium", "true");
    if (initialSort) params.set("sort", initialSort);

    router.push(`/buscar?${params.toString()}`);
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
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            list="search-cities"
            className="pl-10"
            aria-label="Cidade"
          />
          <datalist id="search-cities">
            {POPULAR_CITIES.map((cityName) => (
              <option key={cityName} value={cityName} />
            ))}
          </datalist>
        </div>
        <Button type="submit" variant="whatsapp" className="sm:w-auto">
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SEARCH_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setSearchType(type.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              searchType === type.value
                ? "bg-whatsapp text-whatsapp-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </form>
  );
}
