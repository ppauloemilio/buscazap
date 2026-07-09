import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
