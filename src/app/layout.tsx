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
    default: "BuscaZapp - Encontre profissionais e serviços no WhatsApp",
    template: "%s | BuscaZapp",
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
    title: "BuscaZapp - Encontre profissionais e serviços no WhatsApp",
    description:
      "Busque profissionais, empresas, produtos e serviços na sua cidade.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/buscazapp-logo.png", alt: "BuscaZapp" }],
  },
  icons: {
    icon: "/buscazapp-logo.png",
    apple: "/buscazapp-logo.png",
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
