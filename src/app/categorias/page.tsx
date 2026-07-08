import type { Metadata } from "next";
import Link from "next/link";
import {
  Heart,
  Sparkles,
  Hammer,
  UtensilsCrossed,
  Laptop,
  GraduationCap,
  Car,
  Shirt,
  ArrowRight,
} from "lucide-react";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/shared/utils/format";

export const metadata: Metadata = {
  title: "Categorias",
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Sparkles,
  Hammer,
  UtensilsCrossed,
  Laptop,
  GraduationCap,
  Car,
  Shirt,
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Explore anúncios por área de atuação"
      />
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = ICON_MAP[category.icon] ?? Heart;
            return (
              <Link
                key={category.id}
                href={`/buscar?category=${category.slug}`}
                className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all hover:border-whatsapp/50 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-whatsapp/10 group-hover:bg-whatsapp/20">
                  <Icon className="h-6 w-6 text-whatsapp" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-foreground">{category.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(category.count)} anúncios
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-whatsapp" />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
