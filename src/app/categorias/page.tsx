import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import { CategoryIcon } from "@/components/category/category-icon";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/shared/utils/format";

export const metadata: Metadata = {
  title: "Categorias",
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <>
      <PageHeader
        compact
        title="Categorias"
        description="Explore anúncios por área de atuação"
      />
      <section className="container mx-auto px-4 py-5">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/buscar?category=${category.slug}`}
              className="group flex items-center gap-2 rounded-lg border bg-card px-2 py-2 transition-all hover:border-whatsapp/50 hover:shadow-md"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-whatsapp/10 group-hover:bg-whatsapp/20">
                <CategoryIcon icon={category.icon} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xs font-semibold text-foreground">
                  {category.name}
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  {formatNumber(category.count)} anúncios
                </p>
              </div>
              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-whatsapp" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
