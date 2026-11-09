"use client";

import { useMemo, useState } from "react";
import {
  deleteBillingCouponAction,
  toggleBillingCouponAction,
  upsertBillingCouponAction,
} from "@/actions/admin-billing-actions";
import {
  BILLING_COUPON_TARGET_LABELS,
  BILLING_DISCOUNT_KIND_LABELS,
  formatBillingDiscountLabel,
  type BillingCouponRecord,
} from "@/application/services/billing-coupon-service";
import {
  BillingCouponTarget,
  BillingDiscountKind,
} from "@/domain/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CityOption = { readonly name: string; readonly stateUf: string };

function toDatetimeLocalValue(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultEndsAt(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return toDatetimeLocalValue(date);
}

interface AdminBillingCouponsManagerProps {
  readonly coupons: readonly (Omit<
    BillingCouponRecord,
    "startsAt" | "endsAt"
  > & {
    readonly startsAt: string;
    readonly endsAt: string;
  })[];
  readonly cities: readonly CityOption[];
}

export function AdminBillingCouponsManager({
  coupons,
  cities,
}: AdminBillingCouponsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [discountKind, setDiscountKind] = useState<BillingDiscountKind>(
    BillingDiscountKind.PERCENT
  );
  const [allCities, setAllCities] = useState(true);

  const cityOptions = useMemo(
    () =>
      [...cities].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
      ),
    [cities]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Cupons de desconto na cobrança BuscaZapp (mensalidade, premium, extras).
        </p>
        <Button
          type="button"
          size="sm"
          variant="whatsapp"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
            setDiscountKind(BillingDiscountKind.PERCENT);
            setAllCities(true);
          }}
        >
          Novo cupom
        </Button>
      </div>

      {creating && (
        <form
          action={upsertBillingCouponAction}
          className="space-y-3 rounded-lg border bg-card p-4"
        >
          <h3 className="font-semibold">Novo cupom</h3>
          <CouponFields
            discountKind={discountKind}
            onDiscountKindChange={setDiscountKind}
            allCities={allCities}
            onAllCitiesChange={setAllCities}
            cities={cityOptions}
            defaults={{
              startsAt: toDatetimeLocalValue(new Date()),
              endsAt: defaultEndsAt(),
              onePerProvider: true,
              isPublic: true,
            }}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="whatsapp" size="sm">
              Criar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreating(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {coupons.map((coupon) => {
          const expired = new Date(coupon.endsAt).getTime() < Date.now();
          const isEditing = editingId === coupon.id;

          return (
            <li
              key={coupon.id}
              className="rounded-lg border bg-card p-4 text-sm"
            >
              {!isEditing ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{coupon.title}</span>
                        <Badge variant="outline">{coupon.code}</Badge>
                        <Badge variant="secondary">{coupon.badgeLabel}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {coupon.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {BILLING_COUPON_TARGET_LABELS[coupon.targetFeature]} ·{" "}
                        {formatBillingDiscountLabel(
                          coupon.discountKind,
                          coupon.discountValue
                        )}{" "}
                        · Restam {coupon.quantityRemaining}/{coupon.quantityTotal}{" "}
                        ·{" "}
                        {coupon.cities.length === 0
                          ? "Todas as cidades"
                          : coupon.cities.join(", ")}
                        {coupon.isPublic ? " · Público" : " · Privado"}
                      </p>
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
                          : "Inativo"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(coupon.id);
                        setCreating(false);
                        setDiscountKind(coupon.discountKind);
                        setAllCities(coupon.cities.length === 0);
                      }}
                    >
                      Editar
                    </Button>
                    <form action={toggleBillingCouponAction}>
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={coupon.isEnabled ? "false" : "true"}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        {coupon.isEnabled ? "Desativar" : "Reativar"}
                      </Button>
                    </form>
                    <form action={deleteBillingCouponAction}>
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Excluir
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <form action={upsertBillingCouponAction} className="space-y-3">
                  <input type="hidden" name="couponId" value={coupon.id} />
                  {coupon.isEnabled && (
                    <input type="hidden" name="isEnabled" value="on" />
                  )}
                  <CouponFields
                    discountKind={discountKind}
                    onDiscountKindChange={setDiscountKind}
                    allCities={allCities}
                    onAllCitiesChange={setAllCities}
                    cities={cityOptions}
                    defaults={{
                      code: coupon.code,
                      title: coupon.title,
                      description: coupon.description,
                      badgeLabel: coupon.badgeLabel,
                      targetFeature: coupon.targetFeature,
                      discountValue: coupon.discountValue,
                      quantityTotal: coupon.quantityTotal,
                      startsAt: toDatetimeLocalValue(coupon.startsAt),
                      endsAt: toDatetimeLocalValue(coupon.endsAt),
                      onePerProvider: coupon.onePerProvider,
                      isPublic: coupon.isPublic,
                      selectedCities: coupon.cities,
                    }}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" variant="whatsapp" size="sm">
                      Salvar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {coupons.length === 0 && !creating && (
        <p className="text-sm text-muted-foreground">
          Nenhum cupom de pagamento cadastrado ainda.
        </p>
      )}
    </div>
  );
}

function CouponFields({
  discountKind,
  onDiscountKindChange,
  allCities,
  onAllCitiesChange,
  cities,
  defaults,
}: {
  readonly discountKind: BillingDiscountKind;
  readonly onDiscountKindChange: (value: BillingDiscountKind) => void;
  readonly allCities: boolean;
  readonly onAllCitiesChange: (value: boolean) => void;
  readonly cities: readonly CityOption[];
  readonly defaults: {
    readonly code?: string;
    readonly title?: string;
    readonly description?: string;
    readonly badgeLabel?: string;
    readonly targetFeature?: BillingCouponTarget;
    readonly discountValue?: number;
    readonly quantityTotal?: number;
    readonly startsAt: string;
    readonly endsAt: string;
    readonly onePerProvider: boolean;
    readonly isPublic: boolean;
    readonly selectedCities?: readonly string[];
  };
}) {
  const selected = new Set(
    (defaults.selectedCities ?? []).map((c) => c.toLowerCase())
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="font-medium">Código</span>
        <Input
          name="code"
          required
          defaultValue={defaults.code}
          placeholder="BEMVINDO50"
          className="uppercase"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Selo</span>
        <Input
          name="badgeLabel"
          required
          defaultValue={defaults.badgeLabel}
          placeholder="50% OFF"
        />
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-medium">Título</span>
        <Input name="title" required defaultValue={defaults.title} />
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-medium">Descrição</span>
        <Input
          name="description"
          required
          defaultValue={defaults.description}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Funcionalidade</span>
        <select
          name="targetFeature"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={
            defaults.targetFeature ?? BillingCouponTarget.SUBSCRIPTION_BASIC
          }
          required
        >
          {Object.values(BillingCouponTarget).map((value) => (
            <option key={value} value={value}>
              {BILLING_COUPON_TARGET_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Tipo de desconto</span>
        <select
          name="discountKind"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={discountKind}
          onChange={(event) =>
            onDiscountKindChange(event.target.value as BillingDiscountKind)
          }
          required
        >
          {Object.values(BillingDiscountKind).map((value) => (
            <option key={value} value={value}>
              {BILLING_DISCOUNT_KIND_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      {discountKind !== BillingDiscountKind.FREE && (
        <label className="space-y-1 text-sm">
          <span className="font-medium">
            {discountKind === BillingDiscountKind.PERCENT
              ? "Percentual"
              : "Valor (R$)"}
          </span>
          <Input
            name="discountValue"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults.discountValue ?? 10}
          />
        </label>
      )}
      {discountKind === BillingDiscountKind.FREE && (
        <input type="hidden" name="discountValue" value="0" />
      )}
      <label className="space-y-1 text-sm">
        <span className="font-medium">Quantidade máxima</span>
        <Input
          name="quantityTotal"
          type="number"
          min="1"
          required
          defaultValue={defaults.quantityTotal ?? 50}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Início</span>
        <Input
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={defaults.startsAt}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">Fim</span>
        <Input
          name="endsAt"
          type="datetime-local"
          required
          defaultValue={defaults.endsAt}
        />
      </label>

      <div className="space-y-2 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allCities}
            onChange={(event) => onAllCitiesChange(event.target.checked)}
          />
          Todas as cidades
        </label>
        {!allCities && (
          <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-3">
            {cityOptionsList(cities, selected)}
          </div>
        )}
        {allCities ? <input type="hidden" name="allCities" value="on" /> : null}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublic"
          value="on"
          defaultChecked={defaults.isPublic}
        />
        Público (aparece em ofertas para anunciantes)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="onePerProvider"
          value="on"
          defaultChecked={defaults.onePerProvider}
        />
        1 uso por anunciante
      </label>
    </div>
  );
}

function cityOptionsList(
  cities: readonly CityOption[],
  selected: Set<string>
) {
  return cities.map((city) => (
    <label key={`${city.name}-${city.stateUf}`} className="flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        name="cities"
        value={city.name}
        defaultChecked={selected.has(city.name.toLowerCase())}
      />
      {city.name}/{city.stateUf}
    </label>
  ));
}
