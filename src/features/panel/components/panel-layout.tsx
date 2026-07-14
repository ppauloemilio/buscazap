import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Megaphone,
  Receipt,
  User,
} from "lucide-react";
import { getCurrentProvider, canProviderPublish, isAdminProvider, isProviderBlocked } from "@/lib/provider-session";

const NAV_ITEMS = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { href: "/painel/perfil", label: "Meu perfil", icon: User },
  { href: "/painel/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/painel/anuncios", label: "Meus anúncios", icon: Megaphone },
  { href: "/painel/pagamentos", label: "Pagamentos", icon: Receipt },
] as const;

export async function PanelLayout({ children }: { children: React.ReactNode }) {
  const provider = await getCurrentProvider();

  if (!provider) {
    redirect("/entrar");
  }

  if (isProviderBlocked(provider.status)) {
    redirect(
      `/entrar?error=${encodeURIComponent("Sua conta está bloqueada. Entre em contato com o suporte.")}`
    );
  }

  const subscriptionActive = canProviderPublish(provider);
  const isAdmin = isAdminProvider(provider);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Painel do Usuário</h1>
        <p className="text-sm text-muted-foreground">
          Olá, {provider.name}
          {isAdmin
            ? " — acesso administrativo (sem cobrança)"
            : subscriptionActive
              ? " — assinatura ativa"
              : " — assinatura inativa"}
        </p>
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
