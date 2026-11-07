"use client";

import { useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { neighborhoodsForCity } from "@/shared/utils/neighborhoods";
import { resolveCatalogPlace } from "@/shared/utils/place-match";

type CityNeighborhoodGroup = {
  readonly city: string;
  readonly neighborhoods: readonly string[];
};

type ReverseApiSuccess = {
  readonly ok: true;
  readonly city: string;
  readonly neighborhood: string | null;
  readonly state: string | null;
};

type ReverseApiError = {
  readonly ok: false;
  readonly error?: string;
};

export type NearbyPlace = {
  readonly city: string;
  readonly neighborhood: string;
};

interface UseMyLocationButtonProps {
  readonly cities: readonly string[];
  /** Lista plana de bairros da cidade atual (ex.: SearchForm). */
  readonly neighborhoods?: readonly string[];
  /** Bairros por cidade (ex.: HeroSearch). Preferível quando disponível. */
  readonly neighborhoodsByCity?: readonly CityNeighborhoodGroup[];
  readonly onResolved: (place: NearbyPlace) => void;
  readonly className?: string;
  readonly compact?: boolean;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Seu navegador não suporta geolocalização."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 60_000,
    });
  });
}

function geolocationErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as GeolocationPositionError).code;
    if (code === 1) {
      return "Permissão de localização negada. Ative nas configurações do navegador.";
    }
    if (code === 2) {
      return "Não foi possível obter sua localização.";
    }
    if (code === 3) {
      return "A busca da localização demorou demais. Tente de novo.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Não foi possível usar sua localização.";
}

export function UseMyLocationButton({
  cities,
  neighborhoods = [],
  neighborhoodsByCity = [],
  onResolved,
  className,
  compact = false,
}: UseMyLocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    try {
      const position = await getPosition();
      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `/api/geolocation/reverse?lat=${encodeURIComponent(String(latitude))}&lng=${encodeURIComponent(String(longitude))}`
      );
      const data = (await response.json()) as ReverseApiSuccess | ReverseApiError;

      if (!response.ok || !data.ok) {
        throw new Error(
          !data.ok && data.error
            ? data.error
            : "Não foi possível identificar sua cidade."
        );
      }

      // Primeiro casa a cidade; depois os bairros dessa cidade (evita misturar listas).
      const cityOnly = resolveCatalogPlace({
        cities,
        neighborhoods: [],
        geocodedCity: data.city,
        geocodedNeighborhood: null,
      });

      if (!cityOnly) {
        throw new Error("Não encontramos uma cidade para essa localização.");
      }

      const neighborhoodsForCityList =
        neighborhoodsByCity.length > 0
          ? neighborhoodsForCity(neighborhoodsByCity, cityOnly.city)
          : neighborhoods;

      const place =
        resolveCatalogPlace({
          cities,
          neighborhoods: neighborhoodsForCityList,
          geocodedCity: cityOnly.city,
          geocodedNeighborhood: data.neighborhood,
        }) ?? cityOnly;

      onResolved(place);
    } catch (err) {
      setError(geolocationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("w-full text-left", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={() => void handleClick()}
        className={cn(
          "h-auto px-0 py-0 text-xs font-medium text-whatsapp hover:bg-transparent hover:text-whatsapp/90",
          compact && "text-[11px]"
        )}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <LocateFixed className="h-3.5 w-3.5" aria-hidden />
        )}
        {loading ? "Localizando…" : "Usar minha localização"}
      </Button>
      {error ? (
        <p className="mt-1 text-[11px] leading-snug text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
