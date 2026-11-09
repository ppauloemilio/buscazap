import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentType } from "@/domain/enums";
import {
  generatePaymentQrCode,
  getPaymentById,
} from "@/application/services/payment-service";
import { PIX_CONFIG } from "@/config/pix";
import { getCurrentProvider } from "@/lib/provider-session";
import { PageHeader } from "@/components/layout/page-header";
import { PixPayment } from "@/features/payment/components/pix-payment";
import { Button } from "@/components/ui/button";

interface PaymentPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  [PaymentType.SUBSCRIPTION]: "Assinatura mensal do anunciante",
  [PaymentType.PREMIUM_BOOST]: "Destaque premium do anúncio (30 dias)",
};

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;
  const provider = await getCurrentProvider();

  if (!provider) {
    redirect("/entrar");
  }

  const payment = await getPaymentById(id, provider.id);

  if (!payment) {
    redirect("/painel");
  }

  if (payment.pixCopyPaste === "FREE_COUPON" || payment.amount <= 0) {
    redirect(
      payment.type === PaymentType.PREMIUM_BOOST
        ? "/painel/anuncios"
        : "/painel/assinatura?cupom=1"
    );
  }

  const qrCodeDataUrl = await generatePaymentQrCode(payment.pixCopyPaste);
  const typeLabel = payment.billingCouponCode
    ? `${TYPE_LABELS[payment.type] ?? payment.type} · cupom ${payment.billingCouponCode}`
    : (TYPE_LABELS[payment.type] ?? payment.type);

  return (
    <>
      <PageHeader
        title="Pagamento"
        description="Escaneie o QR Code ou copie o código PIX para concluir"
      />
      <section className="container mx-auto px-4 py-10">
        {payment.amountOriginal != null &&
          payment.amountOriginal > payment.amount && (
            <p className="mb-4 text-center text-sm text-muted-foreground">
              De{" "}
              <span className="line-through">
                R$ {payment.amountOriginal.toFixed(2).replace(".", ",")}
              </span>{" "}
              por{" "}
              <span className="font-semibold text-whatsapp">
                R$ {payment.amount.toFixed(2).replace(".", ",")}
              </span>
              {payment.billingCouponCode
                ? ` com cupom ${payment.billingCouponCode}`
                : ""}
            </p>
          )}
        <PixPayment
          paymentId={payment.id}
          amount={payment.amount}
          pixCopyPaste={payment.pixCopyPaste}
          qrCodeDataUrl={qrCodeDataUrl}
          typeLabel={typeLabel}
          status={payment.status}
          allowSimulate={PIX_CONFIG.enableSimulate}
          enablePolling={!PIX_CONFIG.enableSimulate && payment.status === "PENDING"}
        />

        {payment.status === "PAID" && (
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="whatsapp" asChild>
              <Link href="/painel">Ir para o painel</Link>
            </Button>
            {payment.type === PaymentType.PREMIUM_BOOST && payment.referenceId && (
              <Button variant="outline" asChild>
                <Link href={`/painel/anuncios/${payment.referenceId}/editar?boosted=1`}>
                  Adicionar fotos da galeria
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
