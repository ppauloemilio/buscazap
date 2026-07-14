import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Advertisement } from "@/domain/entities";
import { AdvertisementCard } from "./advertisement-card";

interface AdvertisementSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly advertisements: readonly Advertisement[];
  readonly viewAllHref?: string;
}

export function AdvertisementSection({
  title,
  description,
  advertisements,
  viewAllHref,
}: AdvertisementSectionProps) {
  if (advertisements.length === 0) {
    return null;
  }

  return (
    <section className="py-4 md:py-5">
      <div className="container mx-auto px-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-sm font-medium text-whatsapp hover:underline"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {advertisements.map((ad) => (
            <AdvertisementCard key={ad.id} advertisement={ad} />
          ))}
        </div>
      </div>
    </section>
  );
}
