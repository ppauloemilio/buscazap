"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";

interface HeroSearchProps {
  readonly cities?: readonly string[];
}

const SEARCH_TYPES = [
  { value: "all", label: "Tudo" },
  { value: "PROFESSIONAL", label: "Profissionais" },
  { value: "COMPANY", label: "Empresas" },
  { value: "PRODUCT", label: "Produtos" },
  { value: "SERVICE", label: "Serviços" },
] as const;

export function HeroSearch({ cities = POPULAR_CITIES }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [searchType, setSearchType] = useState("all");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (searchType !== "all") params.set("type", searchType);
    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-whatsapp/10 via-background to-primary/5 px-4 pb-6 pt-6 md:pb-8 md:pt-8">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:mb-3 md:text-5xl">
          Encontre o <span className="text-whatsapp">Whatsapp</span> do que você precisa
        </h1>
        <p className="mb-5 text-base text-muted-foreground md:mb-6 md:text-lg">
          Profissionais, empresas, produtos e serviços na sua cidade.
          Busque, compare e entre em contato direto.
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto max-w-2xl space-y-3 rounded-2xl border bg-card p-4 shadow-lg md:p-6"
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
            <div className="relative sm:w-48">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                list="cities"
                className="pl-10"
                aria-label="Cidade"
              />
              <datalist id="cities">
                {cities.map((cityName) => (
                  <option key={cityName} value={cityName} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
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

            <Button type="submit" variant="whatsapp" size="lg">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Populares:</span>
          {["Eletricista", "Dentista", "Delivery", "Mecânico"].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full bg-muted px-3 py-1 text-xs font-medium transition-colors hover:bg-whatsapp/10 hover:text-whatsapp"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
