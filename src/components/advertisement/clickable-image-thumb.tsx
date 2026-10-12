"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export const IMAGE_THUMB_CLASS =
  "relative h-20 w-20 overflow-hidden rounded-md border bg-muted transition hover:opacity-90 sm:h-24 sm:w-24";

interface ClickableImageThumbProps {
  readonly src: string;
  readonly alt: string;
  readonly onOpen: (url: string) => void;
  readonly className?: string;
}

export function ClickableImageThumb({
  src,
  alt,
  onOpen,
  className,
}: ClickableImageThumbProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className={cn(IMAGE_THUMB_CLASS, className)}
      aria-label={`Ampliar: ${alt}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="96px"
      />
    </button>
  );
}
