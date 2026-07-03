import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-whatsapp">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-foreground">
        Página não encontrada
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        O conteúdo que você procura não existe ou foi removido.
      </p>
      <Button variant="whatsapp" className="mt-8" asChild>
        <Link href="/">
          <Search className="h-4 w-4" />
          Voltar ao início
        </Link>
      </Button>
    </section>
  );
}
