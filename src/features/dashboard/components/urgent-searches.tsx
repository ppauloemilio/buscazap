"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { URGENT_SEARCHES } from "@/config/quick-searches";
import {
  buildSearchHref,
  getPreferredCity,
} from "@/shared/utils/search-preferences";

export function UrgentSearches() {
  const [city, setCity] = useState("");

  useEffect(() => {
    setCity(getPreferredCity());
  }, []);

  return (
    <section className="border-b bg-background py-5">
      <div className="container mx-auto px-4">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-foreground">Precisa agora?</h2>
          <p className="text-sm text-muted-foreground">
            Toque e vá direto aos contatos de WhatsApp
            {city ? ` em ${city}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {URGENT_SEARCHES.map((item) => {
            const Icon = item.icon;
            const href = buildSearchHref({ query: item.query, city });

            return (
              <Link
                key={item.label}
                href={href}
                className="flex flex-col items-center gap-1.5 rounded-lg border bg-card px-2 py-3 text-center transition-colors hover:border-whatsapp/50 hover:bg-whatsapp/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-whatsapp/10">
                  <Icon className="h-4 w-4 text-whatsapp" />
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
