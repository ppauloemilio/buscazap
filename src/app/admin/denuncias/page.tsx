import { redirect } from "next/navigation";
import { updateReportStatusAction } from "@/actions/admin-actions";
import { listAdminReports } from "@/application/services/admin-service";
import { REPORT_STATUS_LABELS } from "@/config/admin";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdminReportsPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly status?: string;
  }>;
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const reports = await listAdminReports(params.status);

  return (
    <AdminLayout>
      <h2 className="mb-3 text-lg font-semibold">Denúncias</h2>

      {params.error && (
        <p className="mb-2 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-2 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
          Denúncia atualizada.
        </p>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma denúncia encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {REPORT_STATUS_LABELS[report.status] ?? report.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {report.createdAt.toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm">
                  <strong>Anúncio:</strong> {report.advertisementRef}
                </p>
                <p className="text-sm">
                  <strong>Motivo:</strong> {report.reason}
                </p>
                {report.details && (
                  <p className="text-sm text-muted-foreground">{report.details}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {report.status !== "REVIEWED" && (
                    <form action={updateReportStatusAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="REVIEWED" />
                      <Button type="submit" size="sm" variant="whatsapp">
                        Analisada
                      </Button>
                    </form>
                  )}
                  {report.status !== "DISMISSED" && (
                    <form action={updateReportStatusAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="DISMISSED" />
                      <Button type="submit" size="sm" variant="outline">
                        Arquivar
                      </Button>
                    </form>
                  )}
                  {report.status !== "OPEN" && (
                    <form action={updateReportStatusAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="OPEN" />
                      <Button type="submit" size="sm" variant="outline">
                        Reabrir
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
