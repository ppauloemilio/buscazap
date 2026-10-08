"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Megaphone,
  Receipt,
  User,
  Gift,
  Sparkles,
  BarChart3,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: ReadonlyArray<{
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}> = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { href: "/painel/perfil", label: "Meu perfil", icon: User },
  { href: "/painel/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/painel/anuncios", label: "Meus anúncios", icon: Megaphone },
  { href: "/painel/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { href: "/painel/indicacoes", label: "Indicações", icon: Gift },
  { href: "/painel/kit", label: "Kit divulgação", icon: Sparkles },
  { href: "/painel/pagamentos", label: "Pagamentos", icon: Receipt },
];

function isActive(pathname: string, href: string) {
  if (href === "/painel") return pathname === "/painel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface PanelNavProps {
  readonly showPromotions?: boolean;
}

export function PanelNav({ showPromotions = false }: PanelNavProps) {
  const pathname = usePathname();
  const items = showPromotions
    ? [
        ...NAV_ITEMS.slice(0, 3),
        { href: "/painel/promocoes", label: "Promoções", icon: Tag },
        ...NAV_ITEMS.slice(3),
      ]
    : NAV_ITEMS;

  return (
    <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex lg:flex-col">
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-9 items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors",
              active
                ? "border-whatsapp bg-whatsapp text-whatsapp-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:border-whatsapp/50 hover:bg-whatsapp/5"
            )}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
