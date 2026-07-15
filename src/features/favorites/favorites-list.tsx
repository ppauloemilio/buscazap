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
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-10 text-center">
        <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {ads.map((ad) => (
        <AdvertisementCard key={ad.id} advertisement={ad} />
      ))}
    </div>
  );
}
