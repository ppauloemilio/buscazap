import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import type { Advertisement } from "@/domain/entities";
import { cn } from "@/lib/utils";
import { AdvertisementCard } from "./advertisement-card";

interface AdvertisementSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly advertisements: readonly Advertisement[];
  readonly viewAllHref?: string;
  readonly returnTo?: string;
  readonly variant?: "default" | "premium" | "free";
  readonly emphasizePremium?: boolean;
  /** Grid mais denso para listagens básicas. */
  readonly compact?: boolean;
}

export function AdvertisementSection({
  title,
  description,
  advertisements,
  viewAllHref,
  returnTo = "/",
  variant = "default",
  emphasizePremium = false,
  compact = false,
}: AdvertisementSectionProps) {
  if (advertisements.length === 0) {
    return null;
  }

  const isPremiumSection = variant === "premium";
  const isFreeSection = variant === "free" || compact;

  return (
    <section className="py-4 md:py-5">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            isPremiumSection &&
              "rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 md:p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2
                className={cn(
                  "flex items-center gap-2 text-2xl font-bold text-foreground",
                  isPremiumSection && "text-amber-950 dark:text-amber-100",
                  isFreeSection && !isPremiumSection && "text-xl"
                )}
              >
                {isPremiumSection && (
                  <Crown className="h-5 w-5 shrink-0 text-amber-500" />
                )}
                {title}
              </h2>
              {description && (
                <p
                  className={cn(
                    "mt-1 text-sm text-muted-foreground",
                    isPremiumSection && "text-amber-900/70 dark:text-amber-200/70"
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className={cn(
                  "flex shrink-0 items-center gap-1 text-sm font-medium hover:underline",
                  isPremiumSection
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-whatsapp"
                )}
              >
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div
            className={cn(
              "grid items-start gap-2",
              isFreeSection
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
            )}
          >
            {advertisements.map((ad) => (
              <AdvertisementCard
                key={ad.id}
                advertisement={ad}
                returnTo={returnTo}
                emphasizePremium={emphasizePremium && ad.isPremium}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
