import {
  getMercadoPagoAccessToken,
  getPixProviderName,
} from "@/config/pix";
import { MercadoPagoPixProvider } from "./mercadopago-pix-provider";
import { StaticPixProvider } from "./static-pix-provider";
import type { PixProvider } from "./types";

export function getPixProvider(): PixProvider {
  const accessToken = getMercadoPagoAccessToken();

  if (accessToken) {
    return new MercadoPagoPixProvider();
  }

  if (getPixProviderName() === "mercadopago") {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não está configurado na Vercel. Copie o token TEST-... em Credenciais de teste do Mercado Pago, salve na Vercel e faça redeploy."
    );
  }

  return new StaticPixProvider();
}

export type { PixChargeInput, PixChargeResult, PixProvider } from "./types";
