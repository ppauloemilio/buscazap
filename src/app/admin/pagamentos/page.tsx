import { redirect } from "next/navigation";
import { listAdminPayments } from "@/application/services/admin-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Assinatura",
  PREMIUM_BOOST: "Destaque premium",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

export default async function AdminPaymentsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const payments = await listAdminPayments();

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold">Pagamentos</h2>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum pagamento registrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      R$ {payment.amount.toFixed(2).replace(".", ",")}
                    </p>
                    <Badge variant="outline">
                      {PAYMENT_TYPE_LABELS[payment.type] ?? payment.type}
                    </Badge>
                    <Badge
                      variant={payment.status === "PAID" ? "whatsapp" : "secondary"}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {payment.provider.name} ({payment.provider.email})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.createdAt.toLocaleString("pt-BR")}
                    {payment.paidAt
                      ? ` · pago em ${payment.paidAt.toLocaleString("pt-BR")}`
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
