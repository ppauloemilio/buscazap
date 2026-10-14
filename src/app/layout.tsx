import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { TrackPageView } from "@/components/analytics/analytics-trackers";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default:
      "BuscaZapp — WhatsApp, telefone e contatos de empresas em Belém",
    template: "%s | BuscaZapp",
  },
  description:
    "Guia de contatos WhatsApp em Belém e região. Encontre telefone, Zap e WhatsApp de empresas, prestadores, categorias e serviços locais.",
  keywords: [
    "WhatsApp Belém",
    "Guia de contatos WhatsApp Belém",
    "Telefones úteis Belém",
    "Zap Belém",
    "telefone",
    "contato",
    "empresas",
    "prestadores",
    "serviços",
    "Ananindeua",
    "busca local",
    "BuscaZapp",
  ],
  openGraph: {
    title:
      "BuscaZapp — WhatsApp, telefone e contatos de empresas em Belém",
    description:
      "Encontre WhatsApp, telefone e Zap de empresas e serviços em Belém e região.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/buscazapp-mark.png", alt: "BuscaZapp" }],
  },
  icons: {
    icon: [{ url: "/buscazapp-mark.png", type: "image/png" }],
    apple: "/buscazapp-mark.png",
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
        <TrackPageView />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
