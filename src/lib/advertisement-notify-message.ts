import { buildAbsoluteUrl } from "@/lib/site-url";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
import { buildWhatsAppLink } from "@/shared/utils/format";

export interface AdvertisementNotifyMessageInput {
  readonly providerName: string;
  readonly adTitle: string;
  readonly whatsapp: string;
  readonly adUrl: string;
  readonly temporaryPassword?: string | null;
}

export function buildAdvertisementPublishedWhatsAppMessage(
  input: AdvertisementNotifyMessageInput
): string {
  const loginDigits = toLocalWhatsAppDigits(input.whatsapp);

  if (input.temporaryPassword?.trim()) {
    return (
      `Olá ${input.providerName}! Seu anúncio "${input.adTitle}" já está no BuscaZapp: ${input.adUrl}\n\n` +
      `Para acessar o painel: ${buildAbsoluteUrl("/entrar")}\n` +
      `Login (WhatsApp): ${loginDigits}\n` +
      `Senha temporária: ${input.temporaryPassword.trim()}\n\n` +
      `Troque a senha no painel quando puder.`
    );
  }

  return (
    `Olá ${input.providerName}! Seu anúncio "${input.adTitle}" já está no BuscaZapp: ${input.adUrl}\n\n` +
    `Para acessar o painel: ${buildAbsoluteUrl("/entrar")}\n` +
    `Login (WhatsApp): ${loginDigits}\n\n` +
    `Se ainda não definiu senha, peça ajuda ao suporte ou use Esqueci minha senha.`
  );
}

export function buildAdvertisementNotifyWhatsAppHref(
  input: AdvertisementNotifyMessageInput
): string {
  return buildWhatsAppLink(
    input.whatsapp,
    buildAdvertisementPublishedWhatsAppMessage(input)
  );
}

export interface AdvertisementRenewalMessageInput {
  readonly providerName: string;
  readonly adTitle: string;
  readonly whatsapp: string;
}

export function buildAdvertisementRenewalWhatsAppMessage(
  input: AdvertisementRenewalMessageInput
): string {
  return (
    `Olá ${input.providerName}! Seu anúncio "${input.adTitle}" no BuscaZapp venceu e pode ter saído das buscas.\n\n` +
    `Adoraríamos que você renovasse para continuar ajudando as pessoas a localizarem os seus serviços.\n\n` +
    `Renove pelo painel: ${buildAbsoluteUrl("/painel/assinatura")}`
  );
}

export function buildAdvertisementRenewalWhatsAppHref(
  input: AdvertisementRenewalMessageInput
): string {
  return buildWhatsAppLink(
    input.whatsapp,
    buildAdvertisementRenewalWhatsAppMessage(input)
  );
}

export interface PixCopyPasteWhatsAppInput {
  readonly providerName: string;
  readonly whatsapp: string;
  readonly amountLabel: string;
  readonly pixCopyPaste: string;
  readonly kind: "subscription" | "premium";
  readonly adTitle?: string;
}

export function buildPixCopyPasteWhatsAppMessage(
  input: PixCopyPasteWhatsAppInput
): string {
  const subject =
    input.kind === "premium"
      ? `destaque premium do anúncio "${input.adTitle ?? "seu anúncio"}"`
      : "assinatura mensal do BuscaZapp";

  return (
    `Olá ${input.providerName}! Segue o Pix copia e cola da ${subject} (${input.amountLabel}).\n\n` +
    `Cole o código abaixo no app do seu banco para pagar:\n\n` +
    `${input.pixCopyPaste}\n\n` +
    `Após o pagamento, a liberação é automática.`
  );
}

export function buildPixCopyPasteWhatsAppHref(
  input: PixCopyPasteWhatsAppInput
): string {
  return buildWhatsAppLink(
    input.whatsapp,
    buildPixCopyPasteWhatsAppMessage(input)
  );
}
