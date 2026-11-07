"use client";

import { useEffect, useState } from "react";
import { AdvertisementImage } from "@/components/advertisement/advertisement-image";
import { SPONSOR_BANNER_RECOMMENDATION } from "@/config/sponsor-banners";
import { cn } from "@/lib/utils";

export type SponsorBannerSlide = {
  readonly id: string;
  readonly title: string;
  readonly imageUrl: string;
  readonly linkUrl: string | null;
};

interface SponsorBannersCarouselProps {
  readonly banners: readonly SponsorBannerSlide[];
}

export function SponsorBannersCarousel({
  banners,
}: SponsorBannersCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, SPONSOR_BANNER_RECOMMENDATION.rotateIntervalMs);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const current = banners[index] ?? banners[0];
  if (!current) return null;

  const media = (
    <AdvertisementImage
      src={current.imageUrl}
      alt={current.title}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 1200px"
      priority={index === 0}
    />
  );

  return (
    <section className="container mx-auto px-4 py-4 md:py-5">
      <div className="relative overflow-hidden rounded-xl border bg-muted shadow-sm">
        <div className="relative aspect-[3/1] w-full">
          {current.linkUrl ? (
            <a
              href={current.linkUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="absolute inset-0 block"
              aria-label={current.title}
            >
              {media}
            </a>
          ) : (
            media
          )}
        </div>

        {banners.length > 1 ? (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {banners.map((banner, bannerIndex) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Ir para banner ${bannerIndex + 1}`}
                aria-current={bannerIndex === index}
                onClick={() => setIndex(bannerIndex)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  bannerIndex === index
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-1.5 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        Publicidade
      </p>
    </section>
  );
}
