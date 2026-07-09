import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

const FOOTER_LINKS = {
  plataforma: [
    { label: "Como funciona", href: "/como-funciona" },
    { label: "Categorias", href: "/categorias" },
    { label: "Cidades", href: "/cidades" },
    { label: "Anunciar", href: "/anunciar" },
  ],
  suporte: [
    { label: "Central de ajuda", href: "/ajuda" },
    { label: "Denunciar anúncio", href: "/denunciar" },
    { label: "Termos de uso", href: "/termos" },
    { label: "Privacidade", href: "/privacidade" },
  ],
} as const;

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandLogo iconSize={32} textClassName="text-lg" />
            <p className="text-sm text-muted-foreground">
              Encontre profissionais, empresas, produtos e serviços perto de você.
              Contato direto via WhatsApp.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Plataforma</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.plataforma.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Suporte</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.suporte.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Para prestadores</h4>
            <p className="text-sm text-muted-foreground">
              Cadastre seus serviços gratuitamente e alcance milhares de clientes
              na sua região.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BuscaZap. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
