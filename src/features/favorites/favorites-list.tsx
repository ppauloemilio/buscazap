"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getFavoriteAdvertisementsAction } from "@/actions/favorite-actions";
import { AdvertisementCard } from "@/features/dashboard/components/advertisement-card";
import { useFavoriteIds } from "@/features/favorites/favorite-button";
import type { Advertisement } from "@/domain/entities";
import { Button } from "@/components/ui/button";

export function FavoritesList() {
  const favoriteIds = useFavoriteIds();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const favoriteKey = favoriteIds.join("|");

  useEffect(() => {
    startTransition(async () => {
      const results = await getFavoriteAdvertisementsAction(
        favoriteKey ? favoriteKey.split("|") : []
      );
      setAds(results);
      setLoaded(true);
    });
  }, [favoriteKey]);

  if (!loaded || pending) {
    return (
      <p className="text-sm text-muted-foreground">Carregando favoritos...</p>
    );
  }

  if (favoriteIds.length === 0 || ads.length === 0) {
    return (
      <div className="rounded-lg border px-4 py-8 text-center">
        <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="mb-3 text-sm text-muted-foreground">
          Você ainda não salvou anúncios. Toque no coração para guardar contatos.
        </p>
        <Button variant="whatsapp" size="sm" asChild>
          <Link href="/buscar">Buscar anúncios</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ads.map((ad) => (
        <AdvertisementCard key={ad.id} advertisement={ad} />
      ))}
    </div>
  );
}
