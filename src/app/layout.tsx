import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "BuscaZap - Encontre profissionais e serviços no WhatsApp",
    template: "%s | BuscaZap",
  },
  description:
    "Busque profissionais, empresas, produtos e serviços na sua cidade. Contato direto via WhatsApp. Avaliações, favoritos e muito mais.",
  keywords: [
    "whatsapp",
    "profissionais",
    "serviços",
    "empresas",
    "busca local",
    "anúncios",
  ],
  openGraph: {
    title: "BuscaZap - Encontre profissionais e serviços no WhatsApp",
    description:
      "Busque profissionais, empresas, produtos e serviços na sua cidade.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/buscazap-logo.png", alt: "BuscaZap" }],
  },
  icons: {
    icon: "/buscazap-logo.png",
    apple: "/buscazap-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} min-h-screen font-sans antialiased`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
