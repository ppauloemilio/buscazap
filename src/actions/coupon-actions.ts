"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  claimProviderCoupon,
  markCouponRedemptionUsed,
} from "@/application/services/provider-coupon-service";
import { getCurrentProvider } from "@/lib/provider-session";

export async function claimCouponAction(couponId: string) {
  const id = couponId.trim();
  if (!id) {
    throw new Error("Cupom inválido");
  }

  const result = await claimProviderCoupon(id);
  revalidatePath("/");
  revalidatePath("/cupons");
  return result;
}

export async function markCouponUsedAction(formData: FormData) {
  const provider = await getCurrentProvider();
  if (!provider) {
    throw new Error("Faça login para validar cupons");
  }

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) {
    throw new Error("Informe o código do cupom");
  }

  const returnTo = String(formData.get("returnTo") ?? "").trim();

  await markCouponRedemptionUsed({
    providerId: provider.id,
    code,
  });

  revalidatePath("/painel/cupons");
  revalidatePath(`/cupom/${code}`);

  if (returnTo.startsWith("/")) {
    redirect(returnTo);
  }
  redirect("/painel/cupons?saved=1");
}
