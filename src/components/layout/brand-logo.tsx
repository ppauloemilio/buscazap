import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  readonly showText?: boolean;
  readonly className?: string;
  readonly iconSize?: number;
  readonly textClassName?: string;
}

export function BrandLogo({
  showText = true,
  className,
  iconSize = 36,
  textClassName,
}: BrandLogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Image
        src="/buscazap-logo.png"
        alt="BuscaZap"
        width={iconSize}
        height={iconSize}
        className="shrink-0 object-contain"
        priority
      />
      {showText && (
        <span className={cn("text-xl font-bold text-foreground", textClassName)}>
          Busca<span className="text-whatsapp">Zap</span>
        </span>
      )}
    </Link>
  );
}
