import Image, { type ImageProps } from "next/image";
import { shouldSkipImageOptimization } from "@/lib/blob-access";
import { cn } from "@/lib/utils";

type AdvertisementImageProps = Omit<ImageProps, "src"> & {
  readonly src: string;
};

/**
 * Imagens de anúncio (Blob privado/público via /api/media) não devem passar
 * pelo otimizador /_next/image — ele quebra com query strings aninhadas (404).
 */
export function AdvertisementImage({
  src,
  alt,
  className,
  ...props
}: AdvertisementImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      className={cn(className)}
      unoptimized={shouldSkipImageOptimization(src)}
      {...props}
    />
  );
}
