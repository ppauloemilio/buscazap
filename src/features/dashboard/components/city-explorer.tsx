import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";

export function CityExplorer() {
  return (
    <section className="bg-muted/20 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Buscar por cidade
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Encontre profissionais e serviços na sua região
            </p>
          </div>
          <Link
            href="/cidades"
            className="hidden items-center gap-1 text-sm font-medium text-whatsapp hover:underline sm:flex"
          >
            Todas as cidades
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {POPULAR_CITIES.map((city) => (
            <Link
              key={city}
              href={`/buscar?city=${encodeURIComponent(city)}`}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-whatsapp hover:bg-whatsapp/5"
            >
              <MapPin className="h-4 w-4 text-whatsapp" />
              {city}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
