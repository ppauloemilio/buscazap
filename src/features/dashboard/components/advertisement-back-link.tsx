"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { consumeReturnPath } from "@/shared/utils/search-preferences";

interface AdvertisementBackLinkProps {
  readonly fallbackHref?: string;
}

export function AdvertisementBackLink({
  fallbackHref = "/buscar",
}: AdvertisementBackLinkProps) {
  const [href, setHref] = useState(fallbackHref);

  useEffect(() => {
    setHref(consumeReturnPath(fallbackHref));
  }, [fallbackHref]);

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Link>
  );
}
