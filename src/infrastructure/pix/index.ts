import { PIX_CONFIG } from "@/config/pix";
import { MercadoPagoPixProvider } from "./mercadopago-pix-provider";
import { StaticPixProvider } from "./static-pix-provider";
import type { PixProvider } from "./types";

export function getPixProvider(): PixProvider {
  if (PIX_CONFIG.provider === "mercadopago") {
    if (!PIX_CONFIG.mercadoPagoAccessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN não está configurado na Vercel. Adicione o token TEST-... ou APP_USR-... e faça redeploy."
      );
    }

    return new MercadoPagoPixProvider(
      PIX_CONFIG.mercadoPagoAccessToken,
      PIX_CONFIG.appUrl
    );
  }

  return new StaticPixProvider();
}

export type { PixChargeInput, PixChargeResult, PixProvider } from "./types";
