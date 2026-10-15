import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ticket } from "lucide-react";
import {
  getCouponRedemptionByCode,
} from "@/application/services/provider-coupon-service";
import { markCouponUsedAction } from "@/actions/coupon-actions";
import { getCurrentProvider } from "@/lib/provider-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildWhatsAppLink } from "@/shared/utils/format";

interface CouponValidatePageProps {
  readonly params: Promise<{ readonly code: string }>;
}

export async function generateMetadata({
  params,
}: CouponValidatePageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Cupom ${code.toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}

export default async function CouponValidatePage({
  params,
}: CouponValidatePageProps) {
  const { code } = await params;
  const redemption = await getCouponRedemptionByCode(code);
  if (!redemption) {
    notFound();
  }

  const provider = await getCurrentProvider();
  const isOwner = provider?.id === redemption.coupon.providerId;
  const ad = redemption.coupon.provider.advertisements[0];
  const businessName = ad?.title ?? redemption.coupon.provider.name;
  const whatsapp =
    ad?.whatsappNumber ?? redemption.coupon.provider.whatsapp;
  const whatsappLink = buildWhatsAppLink(
    whatsapp,
    `Olá! Estou com o cupom ${redemption.code} (${redemption.coupon.title}) gerado no BuscaZapp.`
  );
  const used = redemption.status === "USED";

  return (
    <section className="container mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-bold">Cupom {redemption.code}</h1>
        </div>

        <Badge variant={used ? "secondary" : "outline"} className="mb-3">
          {used ? "Já utilizado" : "Disponível para uso"}
        </Badge>

        <p className="text-sm font-medium text-emerald-700">{businessName}</p>
        <h2 className="mt-1 text-lg font-semibold">{redemption.coupon.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {redemption.coupon.description}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Selo: {redemption.coupon.badgeLabel}
          <br />
          Gerado em {redemption.issuedAt.toLocaleString("pt-BR")}
          {used && redemption.usedAt
            ? ` · Usado em ${redemption.usedAt.toLocaleString("pt-BR")}`
            : ""}
        </p>

        <div className="mt-5 space-y-2">
          {!used && (
            <Button variant="whatsapp" className="w-full" asChild>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                Enviar no WhatsApp
              </a>
            </Button>
          )}

          {isOwner && !used && (
            <form action={markCouponUsedAction}>
              <input type="hidden" name="code" value={redemption.code} />
              <input
                type="hidden"
                name="returnTo"
                value={`/cupom/${redemption.code}`}
              />
              <Button type="submit" variant="outline" className="w-full">
                Marcar como usado
              </Button>
            </form>
          )}

          <Button variant="ghost" className="w-full" asChild>
            <Link href="/cupons">Ver outros cupons</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
