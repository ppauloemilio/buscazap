"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StickyWhatsAppContact {
  readonly href: string;
  readonly label: string;
}

interface StickyWhatsAppCtaProps {
  readonly href?: string;
  readonly label?: string;
  readonly contacts?: readonly StickyWhatsAppContact[];
}

export function StickyWhatsAppCta({
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
      <div className={`flex gap-2 ${items.length > 1 ? "" : ""}`}>
        {items.map((item) => (
          <Button
            key={item.href + item.label}
            variant="whatsapp"
            className="min-w-0 flex-1"
            asChild
          >
            <a href={item.href} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
