import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  readonly showText?: boolean;
  readonly className?: string;
  readonly iconSize?: number;
  readonly textClassName?: string;
  /** When false, logo is not a link (useful on capture pages). */
  readonly linked?: boolean;
}

export function BrandLogo({
  showText = true,
  className,
  iconSize = 36,
  textClassName,
  linked = true,
}: BrandLogoProps) {
  const content = (
    <>
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
    </>
  );

  if (!linked) {
    return (
      <div className={cn("flex items-center gap-2", className)}>{content}</div>
    );
  }

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      {content}
    </Link>
  );
}
