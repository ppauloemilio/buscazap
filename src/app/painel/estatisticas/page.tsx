import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, MessageCircle, BarChart3, MousePointerClick } from "lucide-react";
import {
  ANALYTICS_REPORT_DAYS_OPTIONS,
  type AnalyticsReportDays,
} from "@/config/analytics";
import { getProviderAnalyticsReport } from "@/application/services/analytics-service";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { getCurrentProvider } from "@/lib/provider-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProviderStatsPageProps {
  readonly searchParams: Promise<{ readonly days?: string }>;
}

function parseDays(value: string | undefined): AnalyticsReportDays {
  const parsed = Number(value);
  if (ANALYTICS_REPORT_DAYS_OPTIONS.includes(parsed as AnalyticsReportDays)) {
    return parsed as AnalyticsReportDays;
  }
  return 30;
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function ProviderStatsPage({
  searchParams,
}: ProviderStatsPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const days = parseDays(params.days);
  const report = await getProviderAnalyticsReport(provider.id, days);

  const maxDaily = Math.max(
    1,
    ...report.daily.map((row) => row.adViews + row.whatsappClicks)
  );

  return (
    <PanelLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Estatísticas</h2>
          <p className="text-sm text-muted-foreground">
            Visitas aos seus anúncios e cliques no WhatsApp nos últimos {days}{" "}
            dias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ANALYTICS_REPORT_DAYS_OPTIONS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={days === option ? "default" : "outline"}
              asChild
            >
              <Link href={`/painel/estatisticas?days=${option}`}>
                {option} dias
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Visitas aos anúncios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{report.totals.adViews}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Aberturas da página do anúncio
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <MousePointerClick className="h-3.5 w-3.5" />
              Cliques no WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{report.totals.whatsappClicks}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Toques no botão de contato
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Atividade diária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          {report.daily.every(
            (row) => row.adViews === 0 && row.whatsappClicks === 0
          ) ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há visitas ou cliques registrados neste período.
            </p>
          ) : (
            report.daily.map((row) => {
              const total = row.adViews + row.whatsappClicks;
              const width =
                total > 0 ? Math.max(4, (total / maxDaily) * 100) : 0;

              return (
                <div
                  key={row.date}
                  className="grid grid-cols-[52px_1fr_auto] items-center gap-2"
                >
                  <span className="text-xs text-muted-foreground">
                    {formatDayLabel(row.date)}
                  </span>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-whatsapp"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{total}</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Por anúncio</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {report.advertisements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não tem anúncios cadastrados.
            </p>
          ) : (
            <div className="space-y-2">
              {report.advertisements.map((ad) => (
                <div
                  key={ad.advertisementId}
                  className="flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ad.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ad.category} · {ad.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      {ad.adViews} visitas
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {ad.whatsappClicks} WhatsApp
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        href={`/painel/anuncios/${ad.advertisementId}/editar`}
                      >
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PanelLayout>
  );
}
