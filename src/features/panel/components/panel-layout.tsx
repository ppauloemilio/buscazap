import { redirect } from "next/navigation";
import { getCurrentProvider, canProviderPublish, isAdminProvider, isProviderBlocked } from "@/lib/provider-session";
import { PanelNav } from "@/features/panel/components/panel-nav";

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
        <PanelNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
