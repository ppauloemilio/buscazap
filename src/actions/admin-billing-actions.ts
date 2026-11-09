"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteBillingCoupon,
  setBillingCouponEnabled,
  upsertBillingCoupon,
} from "@/application/services/billing-coupon-service";
import { updatePricingSettings } from "@/application/services/pricing-settings-service";
import {
  BillingCouponTarget,
  BillingDiscountKind,
} from "@/domain/enums";
import { getCurrentAdmin } from "@/lib/admin-session";

function requireAdmin() {
  return getCurrentAdmin().then((admin) => {
    if (!admin) redirect("/admin/entrar");
    return admin;
  });
}

function parseAmount(raw: FormDataEntryValue | null, label: string): number {
  const value = Number(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} inválido`);
  }
  return Math.round(value * 100) / 100;
}

function parseEnum<T extends string>(
  raw: FormDataEntryValue | null,
  values: readonly T[],
  label: string
): T {
  const value = String(raw ?? "").trim() as T;
  if (!values.includes(value)) {
    throw new Error(`${label} inválido`);
  }
  return value;
}

function parseCities(formData: FormData): string[] {
  if (formData.get("allCities") === "on") {
    return [];
  }
  return formData
    .getAll("cities")
    .map((item) => String(item).trim())
    .filter(Boolean);
}

export async function updatePricingSettingsAction(formData: FormData) {
  await requireAdmin();

  try {
    await updatePricingSettings({
      subscriptionAmount: parseAmount(
        formData.get("subscriptionAmount"),
        "Plano Básico"
      ),
      subscriptionPlusAmount: parseAmount(
        formData.get("subscriptionPlusAmount"),
        "Plano Pro"
      ),
      extraAdAmount: parseAmount(formData.get("extraAdAmount"), "Anúncio extra"),
      extraWhatsappAmount: parseAmount(
        formData.get("extraWhatsappAmount"),
        "WhatsApp extra"
      ),
      premiumBoostAmount: parseAmount(
        formData.get("premiumBoostAmount"),
        "Destaque premium"
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar";
    redirect(`/admin/precos?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/precos");
  revalidatePath("/painel/assinatura");
  revalidatePath("/anunciar");
  revalidatePath("/parceiro");
  revalidatePath("/");
  redirect("/admin/precos?saved=1");
}

export async function upsertBillingCouponAction(formData: FormData) {
  await requireAdmin();

  const couponId = String(formData.get("couponId") ?? "").trim() || undefined;
  const discountKind = parseEnum(
    formData.get("discountKind"),
    Object.values(BillingDiscountKind),
    "Tipo de desconto"
  );
  const targetFeature = parseEnum(
    formData.get("targetFeature"),
    Object.values(BillingCouponTarget),
    "Funcionalidade"
  );

  try {
    await upsertBillingCoupon({
      couponId,
      code: String(formData.get("code") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      badgeLabel: String(formData.get("badgeLabel") ?? ""),
      targetFeature,
      discountKind,
      discountValue: parseAmount(formData.get("discountValue"), "Desconto"),
      quantityTotal: Math.floor(
        parseAmount(formData.get("quantityTotal"), "Quantidade")
      ),
      startsAt: new Date(String(formData.get("startsAt") ?? "")),
      endsAt: new Date(String(formData.get("endsAt") ?? "")),
      isPublic: formData.get("isPublic") === "on",
      onePerProvider: formData.get("onePerProvider") === "on",
      cities: parseCities(formData),
      isEnabled: !couponId ? true : formData.get("isEnabled") === "on",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o cupom";
    redirect(`/admin/cupons-pagamento?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/cupons-pagamento");
  revalidatePath("/ofertas-anunciantes");
  revalidatePath("/anunciar");
  revalidatePath("/");
  redirect("/admin/cupons-pagamento?saved=1");
}

export async function toggleBillingCouponAction(formData: FormData) {
  await requireAdmin();
  const couponId = String(formData.get("couponId") ?? "").trim();
  const enabled = formData.get("enabled") === "true";

  try {
    await setBillingCouponEnabled({ couponId, enabled });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar";
    redirect(`/admin/cupons-pagamento?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/cupons-pagamento");
  revalidatePath("/ofertas-anunciantes");
  redirect("/admin/cupons-pagamento?saved=1");
}

export async function deleteBillingCouponAction(formData: FormData) {
  await requireAdmin();
  const couponId = String(formData.get("couponId") ?? "").trim();
  if (couponId) {
    await deleteBillingCoupon(couponId);
  }
  revalidatePath("/admin/cupons-pagamento");
  revalidatePath("/ofertas-anunciantes");
  redirect("/admin/cupons-pagamento?saved=1");
}
