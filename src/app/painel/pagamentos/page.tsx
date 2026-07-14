import { redirect } from "next/navigation";
import { getProviderPayments } from "@/application/services/payment-service";
import { getCurrentProvider } from "@/lib/provider-session";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentType } from "@/domain/enums";

const TYPE_LABELS: Record<string, string> = {
  [PaymentType.SUBSCRIPTION]: "Assinatura mensal",
  [PaymentType.PREMIUM_BOOST]: "Destaque premium",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

export default async function PaymentsPage() {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const payments = await getProviderPayments(provider.id);

  return (
    <PanelLayout>
      <h2 className="mb-3 text-lg font-semibold">Histórico de pagamentos</h2>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum pagamento realizado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex flex-col gap-1.5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {TYPE_LABELS[payment.type] ?? payment.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.createdAt.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    R$ {payment.amount.toFixed(2).replace(".", ",")}
                  </span>
                  <Badge
                    variant={payment.status === "PAID" ? "whatsapp" : "secondary"}
                  >
                    {STATUS_LABELS[payment.status] ?? payment.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PanelLayout>
  );
}
