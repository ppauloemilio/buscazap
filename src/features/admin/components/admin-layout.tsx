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
  LogOut,
} from "lucide-react";
import { logoutAdminAction } from "@/actions/admin-actions";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/anuncios", label: "Anúncios", icon: Megaphone },
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administração BuscaZap</h1>
          <p className="text-sm text-muted-foreground">
            Logado como {admin.name} ({admin.email})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/painel">Painel prestador</Link>
          </Button>
          <form action={logoutAdminAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
