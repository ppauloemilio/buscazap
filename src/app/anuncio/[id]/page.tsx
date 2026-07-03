import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, MessageCircle, Crown, ArrowLeft } from "lucide-react";
import { getAdvertisementById } from "@/application/services/search-service";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildWhatsAppLink,
  formatRating,
  getAdvertisementTypeLabel,
} from "@/shared/utils/format";

interface AdvertisementPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export async function generateMetadata({
  params,
}: AdvertisementPageProps): Promise<Metadata> {
  const { id } = await params;
  const advertisement = await getAdvertisementById(id);

  if (!advertisement) {
    return { title: "Anúncio não encontrado" };
  }

  return {
    title: advertisement.title,
    description: advertisement.description,
  };
}

export default async function AdvertisementPage({ params }: AdvertisementPageProps) {
  const { id } = await params;
  const advertisement = await getAdvertisementById(id);

  if (!advertisement) {
    notFound();
  }

  const whatsappLink = buildWhatsAppLink(
    advertisement.whatsappNumber,
    `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZap e gostaria de mais informações.`
  );

  const locationLabel = advertisement.location.neighborhood
    ? `${advertisement.location.neighborhood}, ${advertisement.location.city} - ${advertisement.location.state}`
    : `${advertisement.location.city} - ${advertisement.location.state}`;

  return (
    <section className="container mx-auto px-4 py-8">
      <Link
        href="/buscar"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para busca
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border">
          <AdvertisementCover
            title={advertisement.title}
            category={advertisement.category}
          />
          {advertisement.isPremium && (
            <Badge variant="premium" className="absolute left-4 top-4 gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{advertisement.category}</Badge>
            <Badge variant="secondary">
              {getAdvertisementTypeLabel(advertisement.type)}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {formatRating(advertisement.rating)}
              </span>
              <span>({advertisement.reviewCount} avaliações)</span>
            </div>
          </div>

          <h1 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            {advertisement.title}
          </h1>

          <p className="mb-6 text-muted-foreground">{advertisement.description}</p>

          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-whatsapp" />
            {locationLabel}
          </div>

          <Button variant="whatsapp" size="lg" asChild>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-5 w-5" />
              Entrar em contato via WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
