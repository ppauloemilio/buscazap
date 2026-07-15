import { redirect } from "next/navigation";
import { getCurrentProvider, canProviderPublish, isAdminProvider, isProviderBlocked } from "@/lib/provider-session";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { PanelNav } from "@/features/panel/components/panel-nav";
import { SubscriptionReminderBanner } from "@/features/panel/components/subscription-reminder-banner";
import { AdminViewSwitcher } from "@/components/layout/admin-view-switcher";

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
  const subscription = await getSubscriptionStatus(provider.id);

  return (
    <div className="container mx-auto px-4 py-4 md:py-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Painel do Usuário</h1>
          <p className="text-sm text-muted-foreground">
            Olá, {provider.name}
            {isAdmin
              ? " — acesso administrativo (sem cobrança)"
              : subscriptionActive
                ? subscription.isTrial
                  ? " — período grátis ativo"
                  : " — assinatura ativa"
                : " — assinatura inativa"}
          </p>
        </div>
        {isAdmin && <AdminViewSwitcher className="w-full sm:w-auto" />}
      </div>

      <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
        <PanelNav />
        <div>
          <SubscriptionReminderBanner
            active={subscription.active}
            isAdmin={subscription.isAdmin}
            expiresAt={subscription.expiresAt?.toISOString() ?? null}
            isTrial={subscription.isTrial}
            canRenew={subscription.canRenew}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
