import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { listClaimRequests } from "@/application/services/provider-claim-service";
import {
  CLAIM_REQUEST_STATUS,
  CLAIM_REQUEST_STATUS_LABELS,
  CLAIM_REQUEST_STATUS_OPTIONS,
} from "@/config/claim-requests";
import { formatBuscazappClaimWhatsAppDisplay } from "@/config/claim-whatsapp";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminClaimRequestActions } from "@/features/admin/components/admin-claim-request-actions";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { buildWhatsAppLink } from "@/shared/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  readonly searchParams: Promise<{
    readonly status?: string;
    readonly approved?: string;
  }>;
}

export default async function AdminClaimRequestsPage({ searchParams }: PageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const status = params.status ?? CLAIM_REQUEST_STATUS.PENDING;
  const requests = await listClaimRequests(status);
  const buscazappWa = formatBuscazappClaimWhatsAppDisplay();

  function filterHref(next?: string) {
    return next
      ? `/admin/reivindicacoes?status=${next}`
      : "/admin/reivindicacoes";
  }

  return (
    <AdminLayout>
      <div className="mb-4 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Reivindicações</h2>
          <p className="text-xs text-muted-foreground">
            O anunciante envia o código <strong>BZ-XXXXXX</strong> para o
            WhatsApp do BuscaZapp
            {buscazappWa ? (
              <>
                {" "}
                (<strong>{buscazappWa}</strong>)
              </>
            ) : null}
            . Confira a mensagem e, se estiver certo, aprove para abrir o
            WhatsApp dele com usuário + senha temporária.
          </p>
        </div>

        {params.approved === "1" ? (
          <p className="rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
            Pedido aprovado. Se o WhatsApp não abriu, use o link na confirmação.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {CLAIM_REQUEST_STATUS_OPTIONS.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={status === item ? "default" : "outline"}
              asChild
            >
              <Link href={filterHref(item)}>
                {CLAIM_REQUEST_STATUS_LABELS[item]}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum pedido neste status.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const ads = request.provider.advertisements;
            const waDisplay = formatWhatsAppDisplay(request.whatsapp);
            const openChatHref = buildWhatsAppLink(request.whatsapp);

            return (
              <Card key={request.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{request.provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        WhatsApp do anúncio: {waDisplay}
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold tracking-wider">
                        BZ-{request.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pedido em{" "}
                        {request.createdAt.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {
                        CLAIM_REQUEST_STATUS_LABELS[
                          request.status as keyof typeof CLAIM_REQUEST_STATUS_LABELS
                        ]
                      }
                    </Badge>
                  </div>

                  {ads.length > 0 ? (
                    <ul className="space-y-0.5 text-sm text-muted-foreground">
                      {ads.map((ad) => (
                        <li key={ad.id}>
                          · {ad.title}
                          {ad.neighborhood ? ` — ${ad.neighborhood}` : ""}
                          {ad.city ? `, ${ad.city}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={openChatHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Abrir chat do anunciante
                      </a>
                    </Button>

                    {request.status === CLAIM_REQUEST_STATUS.PENDING ? (
                      <AdminClaimRequestActions requestId={request.id} />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
