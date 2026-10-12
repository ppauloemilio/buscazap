"use client";

import Image from "next/image";

interface ImageLightboxProps {
  readonly url: string | null;
  readonly alt: string;
  readonly onClose: () => void;
}

export function ImageLightbox({ url, alt, onClose }: ImageLightboxProps) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-foreground"
        onClick={onClose}
      >
        Fechar
      </button>
      <div
        className="relative h-[min(80vh,720px)] w-full max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={url}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width:768px) 100vw, 768px"
          priority
        />
      </div>
    </div>
  );
}
