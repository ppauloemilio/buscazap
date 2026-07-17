import type { Metadata } from "next";
import {
  buildCityMetadata,
  CityLandingPage,
} from "@/features/cities/city-landing";

export const metadata: Metadata = buildCityMetadata("Belém", "PA");

export default function BelemPage() {
  return (
    <CityLandingPage
      city="Belém"
      state="PA"
      slug="belem"
      headline="WhatsApp em Belém: gás, água, delivery e serviços"
      description="Encontre anunciantes locais no BuscaZapp e chame direto no WhatsApp. Rápido, sem app extra."
    />
  );
}
