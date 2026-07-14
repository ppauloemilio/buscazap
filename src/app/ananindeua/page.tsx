import type { Metadata } from "next";
import {
  buildCityMetadata,
  CityLandingPage,
} from "@/features/cities/city-landing";

export const metadata: Metadata = buildCityMetadata("Ananindeua", "PA");

export default function AnanindeuaPage() {
  return (
    <CityLandingPage
      city="Ananindeua"
      state="PA"
      slug="ananindeua"
      headline="WhatsApp em Ananindeua: serviços e delivery locais"
      description="Ache gás, água, delivery e profissionais perto de você. Contato direto pelo WhatsApp no BuscaZap."
    />
  );
}
