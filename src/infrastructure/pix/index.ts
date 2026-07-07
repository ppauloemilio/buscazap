import { isMercadoPagoPixEnabled, PIX_CONFIG } from "@/config/pix";
import { MercadoPagoPixProvider } from "./mercadopago-pix-provider";
import { StaticPixProvider } from "./static-pix-provider";
import type { PixProvider } from "./types";

export function getPixProvider(): PixProvider {
  if (isMercadoPagoPixEnabled()) {
    return new MercadoPagoPixProvider(
      PIX_CONFIG.mercadoPagoAccessToken,
      PIX_CONFIG.appUrl
    );
  }

  return new StaticPixProvider();
}

export type { PixChargeInput, PixChargeResult, PixProvider } from "./types";
