import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminUpdateProviderAction } from "@/actions/admin-actions";
import { findProviderForAdminEdit } from "@/application/services/admin-service";
import {
  listActiveCities,
  listActiveStates,
} from "@/application/services/catalog-service";
import {
  getAdminProviderStatusLabel,
} from "@/config/admin";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminEditProviderPageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
  }>;
}

export default async function AdminEditProviderPage({
  params,
  searchParams,
}: AdminEditProviderPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const { id } = await params;
  const query = await searchParams;
  const [provider, states, cities] = await Promise.all([
    findProviderForAdminEdit(id),
    listActiveStates(),
    listActiveCities(),
  ]);

  if (!provider) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="mb-4">
        <Link
          href="/admin/usuarios"
          className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar para usuários
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">Editar usuário</h2>
          <Badge variant="outline">
            {getAdminProviderStatusLabel(provider.status)}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Cadastro em {provider.createdAt.toLocaleDateString("pt-BR")}
        </p>
      </div>

      {query.saved === "1" && (
        <p className="mb-3 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Usuário atualizado com sucesso.
        </p>
      )}

      {query.error && (
        <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {query.error}
        </p>
      )}

      <form
        action={adminUpdateProviderAction}
        className="max-w-2xl space-y-3 rounded-xl border bg-card p-4"
      >
        <input type="hidden" name="providerId" value={provider.id} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Nome completo
            </label>
            <Input id="name" name="name" defaultValue={provider.name} required />
          </div>

          <div>
            <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium">
              WhatsApp (login)
            </label>
            <Input
              id="whatsapp"
              name="whatsapp"
              defaultValue={toLocalWhatsAppDigits(provider.whatsapp)}
              placeholder="91999999999"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              E-mail{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={provider.email ?? ""}
              placeholder="Para recuperação de senha"
            />
          </div>

          <div>
            <label htmlFor="age" className="mb-1 block text-sm font-medium">
              Idade
            </label>
            <Input
              id="age"
              name="age"
              type="number"
              min={18}
              max={120}
              defaultValue={provider.age ?? ""}
              placeholder="Ex.: 35"
            />
          </div>

          <div>
            <label htmlFor="state" className="mb-1 block text-sm font-medium">
              Estado
            </label>
            <select
              id="state"
              name="state"
              defaultValue={provider.state ?? ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {states.map((item) => (
                <option key={item.id} value={item.uf}>
                  {item.uf} — {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium">
              Cidade
            </label>
            <Input
              id="city"
              name="city"
              list="admin-edit-provider-cities"
              defaultValue={provider.city ?? ""}
              placeholder="Cidade"
            />
            <datalist id="admin-edit-provider-cities">
              {cities.map((city) => (
                <option key={city.id} value={city.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="neighborhood" className="mb-1 block text-sm font-medium">
              Bairro
            </label>
            <Input
              id="neighborhood"
              name="neighborhood"
              defaultValue={provider.neighborhood ?? ""}
              placeholder="Opcional"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bio" className="mb-1 block text-sm font-medium">
              Sobre o anunciante
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={provider.bio ?? ""}
              placeholder="Bio / descrição (opcional)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="businessHours" className="mb-1 block text-sm font-medium">
              Horário de atendimento
            </label>
            <Input
              id="businessHours"
              name="businessHours"
              defaultValue={provider.businessHours ?? ""}
              placeholder="Ex.: Seg–Sáb, 8h–18h"
            />
          </div>

          <div>
            <label htmlFor="responseHint" className="mb-1 block text-sm font-medium">
              Tempo de resposta
            </label>
            <Input
              id="responseHint"
              name="responseHint"
              defaultValue={provider.responseHint ?? ""}
              placeholder="Ex.: Respondo em até 15 min"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="whatsapp">
            Salvar alterações
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/anuncios?providerId=${provider.id}`}>
              Ver anúncios
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/usuarios">Cancelar</Link>
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
