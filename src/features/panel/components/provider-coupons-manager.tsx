"use client";

import { Ticket } from "lucide-react";
import { PRICING } from "@/config/pricing";
import {
  deleteProviderCouponAction,
  saveProviderCouponAction,
  toggleProviderCouponAction,
} from "@/actions/provider-actions";
import { markCouponUsedAction } from "@/actions/coupon-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type PanelCoupon = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly quantityTotal: number;
  readonly quantityRemaining: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly isEnabled: boolean;
};

export type PanelCouponRedemption = {
  readonly id: string;
  readonly code: string;
  readonly status: string;
  readonly issuedAt: string;
  readonly usedAt: string | null;
  readonly couponTitle: string;
};

function toDatetimeLocalValue(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface ProviderCouponsManagerProps {
  readonly coupons: readonly PanelCoupon[];
  readonly redemptions: readonly PanelCouponRedemption[];
}

export function ProviderCouponsManager({
  coupons,
  redemptions,
}: ProviderCouponsManagerProps) {
  const canCreate = coupons.length < PRICING.PLUS_MAX_COUPONS;
  const nowIso = new Date().toISOString();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Até {PRICING.PLUS_MAX_COUPONS} cupons por empresa. Cada clique em
        &quot;Pegar cupom&quot; gera um código único e reduz o estoque. Valide
        pelo código no WhatsApp ou em /cupom/CODIGO.
      </p>

      {coupons.map((coupon) => {
        const expired = new Date(coupon.endsAt).getTime() < Date.now();
        return (
          <article
            key={coupon.id}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold">{coupon.title}</h3>
                <Badge variant="outline">{coupon.badgeLabel}</Badge>
              </div>
              <Badge
                variant={
                  coupon.isEnabled && !expired ? "default" : "secondary"
                }
              >
                {expired
                  ? "Expirado"
                  : coupon.isEnabled
                    ? "Ativo"
                    : "Desativado"}
              </Badge>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">
              {coupon.description}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Estoque: {coupon.quantityRemaining}/{coupon.quantityTotal}
            </p>

            <form action={saveProviderCouponAction} className="space-y-2">
              <input type="hidden" name="couponId" value={coupon.id} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input name="title" defaultValue={coupon.title} required />
                <Input
                  name="badgeLabel"
                  defaultValue={coupon.badgeLabel}
                  placeholder="Ex.: 10% OFF"
                  required
                />
              </div>
              <Input
                name="description"
                defaultValue={coupon.description}
                required
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  name="quantityTotal"
                  type="number"
                  min={1}
                  max={9999}
                  defaultValue={coupon.quantityTotal}
                  required
                />
                <Input
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(coupon.startsAt)}
                  required
                />
                <Input
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(coupon.endsAt)}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" variant="whatsapp">
                  Salvar
                </Button>
                {!expired && (
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    formAction={toggleProviderCouponAction}
                    name="enabled"
                    value={coupon.isEnabled ? "false" : "true"}
                  >
                    {coupon.isEnabled ? "Desativar" : "Reativar"}
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  formAction={deleteProviderCouponAction}
                >
                  Excluir
                </Button>
              </div>
            </form>
          </article>
        );
      })}

      {canCreate && (
        <article className="rounded-xl border border-dashed p-4">
          <h3 className="mb-3 font-semibold">Novo cupom</h3>
          <form action={saveProviderCouponAction} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input name="title" placeholder="Título da oferta" required />
              <Input
                name="badgeLabel"
                placeholder="Selo (ex.: 10% OFF)"
                required
              />
            </div>
            <Input
              name="description"
              placeholder="Condições / descrição"
              required
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                name="quantityTotal"
                type="number"
                min={1}
                max={9999}
                defaultValue={50}
                placeholder="Quantidade"
                required
              />
              <Input
                name="startsAt"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(nowIso)}
                required
              />
              <Input
                name="endsAt"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                )}
                required
              />
            </div>
            <Button type="submit" size="sm" variant="whatsapp">
              Criar cupom
            </Button>
          </form>
        </article>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Cupons gerados (últimos 100)</h3>
        {redemptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum cupom resgatado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {redemptions.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold tracking-wide">{item.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.couponTitle} ·{" "}
                    {new Date(item.issuedAt).toLocaleString("pt-BR")}
                    {item.status === "USED" && item.usedAt
                      ? ` · usado em ${new Date(item.usedAt).toLocaleString("pt-BR")}`
                      : ""}
                  </p>
                </div>
                {item.status === "USED" ? (
                  <Badge variant="secondary">Usado</Badge>
                ) : (
                  <form action={markCouponUsedAction}>
                    <input type="hidden" name="code" value={item.code} />
                    <input type="hidden" name="returnTo" value="/painel/cupons?saved=1" />
                    <Button type="submit" size="sm" variant="outline">
                      Marcar usado
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
