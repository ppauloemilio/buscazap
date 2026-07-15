"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AdvertisementGalleryProps {
  readonly coverImageUrl: string;
  readonly galleryImages?: readonly string[];
  readonly title: string;
}

export function AdvertisementGallery({
  coverImageUrl,
  galleryImages = [],
  title,
}: AdvertisementGalleryProps) {
  const images = [coverImageUrl, ...galleryImages];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] ?? coverImageUrl;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted sm:aspect-[4/3]">
        <Image
          src={selectedImage}
          alt={`${title} — foto ${selectedIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition-colors",
                selectedIndex === index
                  ? "border-whatsapp"
                  : "border-transparent opacity-80 hover:opacity-100"
              )}
              aria-label={`Ver foto ${index + 1}`}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-contain"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
