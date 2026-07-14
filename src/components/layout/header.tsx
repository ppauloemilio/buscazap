import Link from "next/link";
import { Search, User, LayoutDashboard, Shield, Plus, LogOut } from "lucide-react";
import { logoutProviderAction } from "@/actions/provider-actions";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { getCurrentProvider, canProviderPublish } from "@/lib/provider-session";
import { isAdminRole } from "@/lib/admin-session";

export async function Header() {
  const provider = await getCurrentProvider();
  const isAdmin = provider ? isAdminRole(provider.role) : false;
  const canPublish = provider ? canProviderPublish(provider) : false;
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative container mx-auto flex h-16 items-center justify-between px-4">
        <BrandLogo />

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
          <Link
            href="/como-funciona"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Como funciona
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
          <MobileNav
            isLoggedIn={Boolean(provider)}
            isAdmin={isAdmin}
            canPublish={canPublish}
          />
          {provider && canPublish && (
            <Button variant="whatsapp" size="sm" className="hidden md:inline-flex" asChild>
              <Link href="/painel/anuncios/novo">
                <Plus className="h-4 w-4" />
                Novo anúncio
              </Link>
            </Button>
          )}
          {provider && (
            <form action={logoutProviderAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="hidden md:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          )}
          <Button variant="outline" size="sm" className="hidden md:inline-flex" asChild>
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
            <Button variant="whatsapp" size="sm" className="hidden md:inline-flex" asChild>
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
