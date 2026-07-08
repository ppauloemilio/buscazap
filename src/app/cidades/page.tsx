import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { listActiveCities } from "@/application/services/catalog-service";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Cidades",
};

export default async function CitiesPage() {
  const cities = await listActiveCities();

  return (
    <>
      <PageHeader
        title="Cidades"
        description="Encontre profissionais e serviços na sua região"
      />
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/buscar?city=${encodeURIComponent(city.name)}`}
              className="group flex items-center justify-between rounded-xl border bg-card px-5 py-4 transition-all hover:border-whatsapp/50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-whatsapp" />
                <div>
                  <span className="block font-medium text-foreground">{city.name}</span>
                  <span className="text-xs text-muted-foreground">{city.state.uf}</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-whatsapp" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
