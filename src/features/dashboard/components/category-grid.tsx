import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/domain/entities";
import { CategoryIcon } from "@/components/category/category-icon";
import { formatNumber } from "@/shared/utils/format";

interface CategoryGridProps {
  readonly categories: readonly Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">
              Categorias populares
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore por área de atuação
            </p>
          </div>
          <Link
            href="/categorias"
            className="hidden items-center gap-1 text-sm font-medium text-whatsapp hover:underline sm:flex"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/buscar?category=${category.slug}`}
              className="group flex flex-col items-center gap-1.5 rounded-lg border bg-card p-2.5 text-center transition-all hover:border-whatsapp/50 hover:shadow-md"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-whatsapp/10 transition-colors group-hover:bg-whatsapp/20">
                <CategoryIcon icon={category.icon} size="md" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-foreground">
                  {category.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatNumber(category.count)} anúncios
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
