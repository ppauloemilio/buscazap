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
