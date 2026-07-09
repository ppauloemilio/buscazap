import Link from "next/link";
import { MessageCircle, Search, Menu, User, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProvider } from "@/lib/provider-session";
import { isAdminRole } from "@/lib/admin-session";

export async function Header() {
  const provider = await getCurrentProvider();
  const isAdmin = provider ? isAdminRole(provider.role) : false;
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-whatsapp">
            <MessageCircle className="h-5 w-5 text-whatsapp-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Busca<span className="text-whatsapp">Zap</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/buscar"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Buscar
          </Link>
          <Link
            href="/categorias"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Categorias
          </Link>
          {!provider && (
            <Link
              href="/anunciar"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Anunciar
            </Link>
          )}
          {provider && (
            <Link
              href="/painel/anuncios"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Meus anúncios
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href={provider ? (isAdmin ? "/admin" : "/painel") : "/entrar"}>
              {provider ? (
                <>
                  {isAdmin ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <LayoutDashboard className="h-4 w-4" />
                  )}
                  {isAdmin ? "Admin" : "Painel"}
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Entrar
                </>
              )}
            </Link>
          </Button>
          {!provider && (
            <Button variant="whatsapp" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/anunciar">
                <Search className="h-4 w-4" />
                Anunciar grátis
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
