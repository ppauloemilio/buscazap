import { redirect } from "next/navigation";
import {
  getCurrentProvider,
  canProviderUsePaidFeatures,
  isAdminProvider,
  isProviderBlocked,
} from "@/lib/provider-session";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { PanelNav } from "@/features/panel/components/panel-nav";
import { canUsePlusFeatures } from "@/lib/plus-plan";
import {
  hasFullListingProfile,
  shouldUseSimpleFreeListingUx,
} from "@/lib/free-listing";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { SubscriptionReminderBanner } from "@/features/panel/components/subscription-reminder-banner";

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

  const subscriptionActive = canProviderUsePaidFeatures(provider);
  const isAdmin = isAdminProvider(provider);
  const subscription = await getSubscriptionStatus(provider.id);
  const showPromotions = await canUsePlusFeatures(provider);
  const simpleListing = shouldUseSimpleFreeListingUx(provider);
  const fullProfile = hasFullListingProfile(provider);
  const freemium = isNewAdProfileEnabled();

  return (
    <div className="container mx-auto px-4 py-4 md:py-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold md:text-2xl">
          {simpleListing ? "Minha listagem" : "Painel do Usuário"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Olá, {provider.name}
          {isAdmin
            ? " — acesso administrativo (sem cobrança)"
            : simpleListing
              ? " — plano grátis"
              : subscriptionActive
                ? subscription.isTrial
                  ? " — período grátis ativo"
                  : " — assinatura ativa"
                : fullProfile && freemium
                  ? " — assinatura vencida (vitrine básica)"
                  : freemium
                    ? " — plano grátis"
                    : " — assinatura inativa"}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
        <PanelNav showPromotions={showPromotions} freeListing={simpleListing} />
        <div>
          <SubscriptionReminderBanner
            active={subscription.active}
            isAdmin={subscription.isAdmin}
            expiresAt={subscription.expiresAt?.toISOString() ?? null}
            isTrial={subscription.isTrial}
            canRenew={subscription.canRenew}
            freeListing={simpleListing}
            expiredFullProfile={fullProfile && !subscriptionActive && !simpleListing}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
