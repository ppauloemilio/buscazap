import { redirect } from "next/navigation";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { AdvertiserKit } from "@/features/panel/components/advertiser-kit";
import { getCurrentProvider } from "@/lib/provider-session";
import { buildAbsoluteUrl, getSiteUrl } from "@/lib/site-url";

export default async function AdvertiserKitPage() {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const invitePath = `/cadastro?ref=${encodeURIComponent(provider.referralCode)}`;

  return (
    <PanelLayout>
      <h2 className="mb-1 text-lg font-semibold">Kit de divulgação</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Textos prontos para status do WhatsApp, stories e grupos. Copie e cole.
      </p>
      <AdvertiserKit
        providerName={provider.name}
        siteUrl={getSiteUrl()}
        inviteUrl={buildAbsoluteUrl(invitePath)}
        referralCode={provider.referralCode}
      />
    </PanelLayout>
  );
}
