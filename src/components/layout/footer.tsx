import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

const SUPPORT_LINKS = [
  { label: "Belém", href: "/belem" },
  { label: "Ananindeua", href: "/ananindeua" },
  { label: "Favoritos", href: "/favoritos" },
  { label: "Central de ajuda", href: "/ajuda" },
  { label: "Denunciar anúncio", href: "/denunciar" },
  { label: "Termos de uso", href: "/termos" },
  { label: "Privacidade", href: "/privacidade" },
] as const;

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <BrandLogo iconSize={24} textClassName="text-base" />

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {SUPPORT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground sm:text-right">
          © {new Date().getFullYear()} BuscaZap
        </p>
      </div>
    </footer>
  );
}
