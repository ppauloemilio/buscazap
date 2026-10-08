"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Category } from "@/domain/entities";
import { CategoryIcon } from "@/components/category/category-icon";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/shared/utils/format";

interface CategoryGridProps {
  readonly categories: readonly Category[];
}

function resolveColumns(width: number): number {
  if (width >= 1280) return 8;
  if (width >= 768) return 6;
  if (width >= 640) return 4;
  return 3;
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [page, setPage] = useState(0);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    function updateColumns() {
      setColumns(resolveColumns(window.innerWidth));
    }

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const pageSize = columns * 2;
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const visibleCategories = useMemo(() => {
    const start = page * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, page, pageSize]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-center justify-between gap-3">
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

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              href={`/buscar?category=${category.slug}`}
              className="group flex h-full min-h-[7.5rem] flex-col items-center gap-1.5 rounded-lg border bg-card p-2.5 text-center transition-all hover:border-whatsapp/50 hover:shadow-md"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-whatsapp/10 transition-colors group-hover:bg-whatsapp/20">
                <CategoryIcon icon={category.icon} size="md" />
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-start">
                <span className="line-clamp-2 min-h-[2.5em] text-xs font-semibold leading-snug text-foreground">
                  {category.name}
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatNumber(category.count)} anúncios
                </span>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={page <= 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              aria-label="Categorias anteriores"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={page >= totalPages - 1}
              onClick={() =>
                setPage((current) => Math.min(totalPages - 1, current + 1))
              }
              aria-label="Próximas categorias"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
