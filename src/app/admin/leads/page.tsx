import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { adminUpdateProviderLeadAction } from "@/actions/provider-lead-actions";
import {
  listProviderLeads,
  resolveLeadPhotoUrl,
} from "@/application/services/provider-lead-service";
import { AdvertisementDescription } from "@/components/advertisement/advertisement-description";
import {
  PROVIDER_LEAD_STATUS_LABELS,
  PROVIDER_LEAD_STATUS_OPTIONS,
} from "@/config/provider-leads";
import { getServiceAreaLabel } from "@/config/service-area";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { buildWhatsAppLink } from "@/shared/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProviderLeadStatus } from "@/domain/enums";

interface AdminLeadsPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly status?: string;
  }>;
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const leads = await listProviderLeads(params.status);

  function filterHref(status?: string) {
    return status ? `/admin/leads?status=${status}` : "/admin/leads";
  }

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Leads (pré-cadastro)</h2>
          <p className="text-xs text-muted-foreground">
            Interessados que preencheram{" "}
            <Link href="/parceiro" className="underline" target="_blank">
              /parceiro
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={!params.status ? "default" : "outline"}
            asChild
          >
            <Link href={filterHref()}>Todos</Link>
          </Button>
          {PROVIDER_LEAD_STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={params.status === option.value ? "default" : "outline"}
              asChild
            >
              <Link href={filterHref(option.value)}>{option.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {params.error && (
        <p className="mb-2 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-2 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
          Lead atualizado.
        </p>
      )}

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum lead encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const photoUrl = resolveLeadPhotoUrl(lead.photoUrl);
            const whatsappHref = buildWhatsAppLink(
              lead.whatsapp,
              `Olá ${lead.name}! Aqui é do BuscaZap. Recebemos seu interesse em anunciar "${lead.adTitle}". Vamos finalizar seu cadastro?`
            );

            return (
              <Card key={lead.id}>
                <CardContent className="space-y-3 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={lead.adTitle}
                        className="h-28 w-full rounded-md border bg-muted object-contain sm:h-24 sm:w-24"
                      />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground sm:h-24 sm:w-24">
                        Sem foto
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <Badge variant="outline">
                          {PROVIDER_LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {lead.adTitle}
                      </p>
                      {lead.description && (
                        <AdvertisementDescription
                          text={lead.description}
                          className="line-clamp-4 text-sm text-muted-foreground"
                        />
                      )}
                      <p className="text-sm text-muted-foreground">
                        WhatsApp: {lead.whatsapp}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lead.neighborhood}, {lead.city}/{lead.state}
                        {getServiceAreaLabel(lead.serviceArea)
                          ? ` · ${getServiceAreaLabel(lead.serviceArea)}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.createdAt.toLocaleString("pt-BR")}
                      </p>
                      {lead.notes && (
                        <p className="text-xs text-muted-foreground">
                          Obs.: {lead.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="whatsapp" asChild>
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/admin/usuarios">Criar anunciante</Link>
                    </Button>
                  </div>

                  <form
                    action={adminUpdateProviderLeadAction}
                    className="flex flex-col gap-2 rounded-lg border border-dashed p-2 sm:flex-row sm:items-end"
                  >
                    <input type="hidden" name="leadId" value={lead.id} />
                    <div className="sm:w-40">
                      <label className="mb-1 block text-[11px] font-medium">Status</label>
                      <select
                        name="status"
                        defaultValue={lead.status}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      >
                        {PROVIDER_LEAD_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-[11px] font-medium">
                        Observação
                      </label>
                      <Input
                        name="notes"
                        defaultValue={lead.notes ?? ""}
                        placeholder="Opcional"
                        className="h-9"
                        maxLength={500}
                      />
                    </div>
                    <Button type="submit" size="sm" variant="outline">
                      Salvar
                    </Button>
                  </form>

                  {lead.status === ProviderLeadStatus.NEW && (
                    <div className="flex flex-wrap gap-1.5">
                      <form action={adminUpdateProviderLeadAction}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={ProviderLeadStatus.CONTACTED}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Marcar contatado
                        </Button>
                      </form>
                      <form action={adminUpdateProviderLeadAction}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={ProviderLeadStatus.CONVERTED}
                        />
                        <Button type="submit" size="sm" variant="whatsapp">
                          Convertido
                        </Button>
                      </form>
                      <form action={adminUpdateProviderLeadAction}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={ProviderLeadStatus.DISMISSED}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Arquivar
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
