"use server";

import { revalidatePath } from "next/cache";
import { confirmPayment } from "@/application/services/payment-service";
import { PIX_CONFIG } from "@/config/pix";
import { requireCurrentProvider } from "@/lib/provider-session";

export async function simulatePixPaymentAction(paymentId: string) {
  if (!PIX_CONFIG.enableSimulate) {
    return { error: "Confirmação manual disponível apenas em desenvolvimento" };
  }

  const provider = await requireCurrentProvider();
  const { getPaymentById } = await import(
    "@/application/services/payment-service"
  );

  const payment = await getPaymentById(paymentId, provider.id);

  if (!payment) {
    return { error: "Pagamento não encontrado" };
  }

  await confirmPayment(payment.pixTxId);

  revalidatePath("/painel");
  revalidatePath("/painel/assinatura");
  revalidatePath("/painel/anuncios");
  revalidatePath("/painel/pagamentos");
  revalidatePath("/buscar");
  revalidatePath("/");

  return { success: true };
}

export async function checkPaymentStatusAction(paymentId: string) {
  const provider = await requireCurrentProvider();
  const { getPaymentById } = await import(
    "@/application/services/payment-service"
  );

  const payment = await getPaymentById(paymentId, provider.id);

  if (!payment) {
    return { error: "Pagamento não encontrado" };
  }

  return { status: payment.status };
}
