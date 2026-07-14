"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyWhatsAppCtaProps {
  readonly href: string;
  readonly label?: string;
}

export function StickyWhatsAppCta({
  href,
  label = "WhatsApp",
}: StickyWhatsAppCtaProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-2.5 backdrop-blur md:hidden">
      <Button variant="whatsapp" className="w-full" asChild>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" />
          {label}
        </a>
      </Button>
    </div>
  );
}
