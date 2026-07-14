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
import type { Category } from "@/domain/entities";
import { formatNumber } from "@/shared/utils/format";

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

interface CategoryGridProps {
  readonly categories: readonly Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
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
          {categories.map((category) => {
            const Icon = ICON_MAP[category.icon] ?? LayoutGrid;
            return (
              <Link
                key={category.id}
                href={`/buscar?category=${category.slug}`}
                className="group flex flex-col items-center gap-1.5 rounded-lg border bg-card p-2.5 text-center transition-all hover:border-whatsapp/50 hover:shadow-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-whatsapp/10 transition-colors group-hover:bg-whatsapp/20">
                  <Icon className="h-4 w-4 text-whatsapp" />
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LayoutGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
