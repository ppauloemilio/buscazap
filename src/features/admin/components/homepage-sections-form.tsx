"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  LayoutGrid,
  MapPin,
  Megaphone,
  Sparkles,
  Tag,
  Ticket,
  Zap,
} from "lucide-react";
import { updateHomepageSettingsAction } from "@/actions/admin-actions";
import type {
  HomepageSectionId,
  HomepageSettings,
} from "@/application/services/homepage-settings-service";
import { HOMEPAGE_SECTION_LABELS } from "@/application/services/homepage-settings-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Record<
  HomepageSectionId,
  ComponentType<{ className?: string }>
> = {
  popularCategories: LayoutGrid,
  urgentSearches: Zap,
  promotions: Tag,
  coupons: Ticket,
  premiumAds: Crown,
  paidAds: Megaphone,
  freeAds: Megaphone,
  cityExplorer: MapPin,
};

const TOGGLEABLE: ReadonlySet<HomepageSectionId> = new Set([
  "popularCategories",
  "urgentSearches",
  "promotions",
  "coupons",
  "premiumAds",
  "paidAds",
  "freeAds",
  "cityExplorer",
]);

const DESCRIPTIONS: Record<HomepageSectionId, string> = {
  popularCategories: "Grade de categorias na página inicial.",
  urgentSearches: "Atalhos rápidos de Gás, Água, Delivery e outros.",
  promotions:
    "Seção na home e menu Promoções no painel (Plano Pro).",
  coupons:
    "Seção na home e menu Cupons no painel (Plano Pro).",
  premiumAds: "Anúncios com destaque premium ativo.",
  paidAds: "Anúncios de assinantes (Plano Básico ou Pro).",
  freeAds: "Listagens do Plano Grátis.",
  cityExplorer: "Lista de cidades para explorar anúncios.",
};

type VisibilityState = {
  popularCategories: boolean;
  urgentSearches: boolean;
  promotions: boolean;
  coupons: boolean;
  premiumAds: boolean;
  paidAds: boolean;
  freeAds: boolean;
  cityExplorer: boolean;
};

interface HomepageSectionsFormProps {
  readonly settings: HomepageSettings;
}

export function HomepageSectionsForm({ settings }: HomepageSectionsFormProps) {
  const [order, setOrder] = useState<HomepageSectionId[]>([
    ...settings.sectionOrder,
  ]);
  const [visibility, setVisibility] = useState<VisibilityState>({
    popularCategories: settings.showPopularCategories,
    urgentSearches: settings.showUrgentSearches,
    promotions: settings.showPromotions,
    coupons: settings.showCoupons,
    premiumAds: settings.showPremiumAds,
    paidAds: settings.showPaidAds,
    freeAds: settings.showFreeAds,
    cityExplorer: settings.showCityExplorer,
  });
  const [plusPlanEnabled, setPlusPlanEnabled] = useState(
    settings.plusPlanEnabled
  );

  const orderValue = useMemo(() => order.join(","), [order]);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <form action={updateHomepageSettingsAction} className="space-y-4">
      <input type="hidden" name="sectionOrder" value={orderValue} />
      {visibility.popularCategories && (
        <input type="hidden" name="showPopularCategories" value="on" />
      )}
      {visibility.urgentSearches && (
        <input type="hidden" name="showUrgentSearches" value="on" />
      )}
      {visibility.promotions && (
        <input type="hidden" name="showPromotions" value="on" />
      )}
      {visibility.coupons && (
        <input type="hidden" name="showCoupons" value="on" />
      )}
      {visibility.premiumAds && (
        <input type="hidden" name="showPremiumAds" value="on" />
      )}
      {visibility.paidAds && (
        <input type="hidden" name="showPaidAds" value="on" />
      )}
      {visibility.freeAds && (
        <input type="hidden" name="showFreeAds" value="on" />
      )}
      {visibility.cityExplorer && (
        <input type="hidden" name="showCityExplorer" value="on" />
      )}
      {plusPlanEnabled && (
        <input type="hidden" name="plusPlanEnabled" value="on" />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordem e visibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="mb-3 text-xs text-muted-foreground">
            Use as setas para definir a ordem na home. Marque para exibir cada
            bloco.
          </p>
          {order.map((id, index) => {
            const Icon = SECTION_ICONS[id];
            const canToggle = TOGGLEABLE.has(id);
            const checked = canToggle
              ? visibility[id as keyof VisibilityState]
              : true;

            return (
              <div
                key={id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  !checked && canToggle && "opacity-60"
                )}
              >
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <button
                    type="button"
                    className="rounded border p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Mover ${HOMEPAGE_SECTION_LABELS[id]} para cima`}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded border p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1}
                    aria-label={`Mover ${HOMEPAGE_SECTION_LABELS[id]} para baixo`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {canToggle ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setVisibility((current) => ({
                        ...current,
                        [id]: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-[hsl(var(--whatsapp))]"
                    aria-label={`Exibir ${HOMEPAGE_SECTION_LABELS[id]}`}
                  />
                ) : (
                  <span className="mt-1 inline-block h-4 w-4 rounded border bg-muted" />
                )}

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-whatsapp/10">
                  <Icon className="h-4 w-4 text-whatsapp" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {HOMEPAGE_SECTION_LABELS[id]}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {DESCRIPTIONS[id]}
                  </span>
                </span>

                <span className="pt-1 text-[10px] font-medium text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recursos do produto</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40">
            <input
              type="checkbox"
              checked={plusPlanEnabled}
              onChange={(event) => setPlusPlanEnabled(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[hsl(var(--whatsapp))]"
            />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-whatsapp/10">
              <Sparkles className="h-4 w-4 text-whatsapp" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Plano Pro (promoções)
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Permite upgrade para Plano Pro. Os menus Promoções e Cupons no
                painel seguem as seções liberadas acima.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Button type="submit" variant="whatsapp">
        Salvar preferências
      </Button>
    </form>
  );
}
