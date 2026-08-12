"use client";

import { MessageCircle } from "lucide-react";
import { TrackedWhatsAppLink } from "@/components/analytics/analytics-trackers";
import { Button } from "@/components/ui/button";

export interface StickyWhatsAppContact {
  readonly href: string;
  readonly label: string;
}

interface StickyWhatsAppCtaProps {
  readonly advertisementId: string;
  readonly href?: string;
  readonly label?: string;
  readonly contacts?: readonly StickyWhatsAppContact[];
}

export function StickyWhatsAppCta({
  advertisementId,
  href,
  label = "WhatsApp",
  contacts,
}: StickyWhatsAppCtaProps) {
  const items =
    contacts && contacts.length > 0
      ? contacts
      : href
        ? [{ href, label }]
        : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-2.5 backdrop-blur md:hidden">
      <div className="flex gap-2">
        {items.map((item) => (
          <Button
            key={item.href + item.label}
            variant="whatsapp"
            className="min-w-0 flex-1"
            asChild
          >
            <TrackedWhatsAppLink
              href={item.href}
              advertisementId={advertisementId}
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-whatsapp px-4 py-2 text-sm font-medium text-whatsapp-foreground"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </TrackedWhatsAppLink>
          </Button>
        ))}
      </div>
    </div>
  );
}
