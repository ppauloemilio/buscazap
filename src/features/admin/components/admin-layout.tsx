import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Tags,
  Map,
  MapPin,
  ShieldAlert,
  ScrollText,
  Receipt,
  Home,
  BarChart3,
  Handshake,
  Search,
  Gift,
} from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin-session";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/busca", label: "Busca", icon: Search },
  { href: "/admin/home", label: "Home", icon: Home },
  { href: "/admin/leads", label: "Leads", icon: Handshake },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/anuncios", label: "Anúncios", icon: Megaphone },
  { href: "/admin/indicacoes", label: "Indicações", icon: Gift },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/estados", label: "Estados", icon: Map },
  { href: "/admin/cidades", label: "Cidades", icon: MapPin },
  { href: "/admin/denuncias", label: "Denúncias", icon: ShieldAlert },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: Receipt },
  { href: "/admin/auditoria", label: "Auditoria", icon: ScrollText },
] as const;

export async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/entrar");
  }

  return (
    <div className="container mx-auto px-4 py-5 md:py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Administração BuscaZapp</h1>
          <p className="text-sm text-muted-foreground">
            Logado como {admin.name} ({admin.email})
          </p>
        </div>
        <form action="/admin/busca" className="flex w-full max-w-md gap-2">
          <input
            name="q"
            placeholder="Buscar usuário, anúncio ou lead..."
            minLength={2}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <button
            type="submit"
            className="inline-flex h-9 shrink-0 items-center rounded-md bg-whatsapp px-3 text-sm font-medium text-whatsapp-foreground"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <nav className="flex flex-row gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
