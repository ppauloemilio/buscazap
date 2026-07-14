"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  Menu,
  X,
  User,
  LayoutDashboard,
  Shield,
  Plus,
  LogOut,
} from "lucide-react";
import { logoutProviderAction } from "@/actions/provider-actions";
import { Button } from "@/components/ui/button";

type MobileNavProps = {
  readonly isLoggedIn: boolean;
  readonly isAdmin: boolean;
  readonly canPublish: boolean;
};

export function MobileNav({ isLoggedIn, isAdmin, canPublish }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuId = useId();
  const panelId = `${menuId}-panel`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const menuPanel =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Fechar menu"
              className="fixed inset-0 top-16 z-[60] bg-black/40"
              onClick={close}
            />
            <div
              id={panelId}
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-0 top-16 z-[70] max-h-[calc(100dvh-4rem)] overflow-y-auto border-b bg-background shadow-md"
            >
              <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
                <Link
                  href="/buscar"
                  onClick={close}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Buscar
                </Link>
                <Link
                  href="/categorias"
                  onClick={close}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Categorias
                </Link>
                {!isLoggedIn && (
                  <Link
                    href="/anunciar"
                    onClick={close}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Anunciar
                  </Link>
                )}
                {isLoggedIn && (
                  <Link
                    href="/painel/anuncios"
                    onClick={close}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Meus anúncios
                  </Link>
                )}

                <div className="my-2 border-t" />

                {isLoggedIn && canPublish && (
                  <Button variant="whatsapp" size="sm" className="justify-start" asChild>
                    <Link href="/painel/anuncios/novo" onClick={close}>
                      <Plus className="h-4 w-4" />
                      Novo anúncio
                    </Link>
                  </Button>
                )}

                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link
                    href={isLoggedIn ? (isAdmin ? "/admin" : "/painel") : "/entrar"}
                    onClick={close}
                  >
                    {isLoggedIn ? (
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

                {!isLoggedIn && (
                  <Button variant="whatsapp" size="sm" className="justify-start" asChild>
                    <Link href="/anunciar" onClick={close}>
                      <Search className="h-4 w-4" />
                      Anunciar grátis
                    </Link>
                  </Button>
                )}

                {isLoggedIn && (
                  <form action={logoutProviderAction}>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </form>
                )}
              </nav>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {menuPanel}
    </div>
  );
}
