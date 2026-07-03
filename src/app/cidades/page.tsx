import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { POPULAR_CITIES } from "@/infrastructure/data/mock-dashboard";

export const metadata: Metadata = {
  title: "Cidades",
};

export default function CitiesPage() {
  return (
    <>
      <PageHeader
        title="Cidades"
        description="Encontre profissionais e serviços na sua região"
      />
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_CITIES.map((city) => (
            <Link
              key={city}
              href={`/buscar?city=${encodeURIComponent(city)}`}
              className="group flex items-center justify-between rounded-xl border bg-card px-5 py-4 transition-all hover:border-whatsapp/50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-whatsapp" />
                <span className="font-medium text-foreground">{city}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-whatsapp" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
